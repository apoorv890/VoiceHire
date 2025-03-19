import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Groq } from 'groq-sdk';
import pdfParse from 'pdf-parse';
import nodemailer from 'nodemailer';
import { AccessToken } from 'livekit-server-sdk';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Job from './models/Job.js';
import Candidate from './models/Candidate.js';
import User from './models/User.js'; // Import User model
import { 
  isLikelyJobTitle, 
  escapeRegExp, 
  createExactMatchRegex, 
  createPartialMatchRegex, 
  normalizeQuery 
} from './utils/searchUtils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const app = express();
app.use(cors());
app.use(express.json());

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Configure file filter to only accept PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize Groq client
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Search jobs endpoint
app.get('/api/search/jobs', async (req, res) => {
  try {
    const { query, department, location, status } = req.query;
    
    // Build search criteria
    const searchCriteria = {};
    
    // Add text search if query is provided
    if (query && query.trim() !== '') {
      searchCriteria.$text = { $search: query };
    }
    
    // Add filters
    if (department) searchCriteria.department = department;
    if (location) searchCriteria.location = location;
    if (status) searchCriteria.status = status;
    
    // Execute search
    let jobs;
    
    if (query && query.trim() !== '') {
      // If using text search, sort by text score
      jobs = await Job.find(
        searchCriteria,
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(20);
    } else {
      // Otherwise, just use filters and sort by date
      jobs = await Job.find(searchCriteria)
        .sort({ createdAt: -1 })
        .limit(20);
    }
    
    res.json(jobs);
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search candidates endpoint
app.get('/api/search/candidates', async (req, res) => {
  try {
    const { query, jobId, minScore, maxScore } = req.query;
    
    // Build search criteria
    const searchCriteria = {};
    
    // Add text search if query is provided
    if (query && query.trim() !== '') {
      searchCriteria.$text = { $search: query };
    }
    
    // Add filters
    if (jobId) searchCriteria.jobId = jobId;
    
    // Add score range filter if provided
    if (minScore !== undefined || maxScore !== undefined) {
      searchCriteria.atsScore = {};
      if (minScore !== undefined) searchCriteria.atsScore.$gte = parseInt(minScore);
      if (maxScore !== undefined) searchCriteria.atsScore.$lte = parseInt(maxScore);
    }
    
    // Execute search
    let candidates;
    
    if (query && query.trim() !== '') {
      // If using text search, sort by text score
      candidates = await Candidate.find(
        searchCriteria,
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" }, createdAt: -1 })
      .limit(20);
    } else {
      // Otherwise, just use filters and sort by date
      candidates = await Candidate.find(searchCriteria)
        .sort({ createdAt: -1 })
        .limit(20);
    }
    
    res.json(candidates);
  } catch (error) {
    console.error('Error searching candidates:', error);
    res.status(500).json({ error: error.message });
  }
});

// Type-ahead suggestions endpoint for jobs
app.get('/api/search/suggestions/jobs', async (req, res) => {
  try {
    const { prefix } = req.query;
    
    if (!prefix || prefix.trim() === '') {
      return res.json([]);
    }
    
    // Get suggestions from different fields
    const titleRegex = new RegExp(`^${prefix}`, 'i');
    const departmentRegex = new RegExp(`^${prefix}`, 'i');
    const locationRegex = new RegExp(`^${prefix}`, 'i');
    
    // Find matching jobs
    const jobs = await Job.find({
      $or: [
        { title: titleRegex },
        { department: departmentRegex },
        { location: locationRegex },
        { keywords: titleRegex }
      ]
    }).limit(10);
    
    // Extract unique suggestions
    const suggestions = new Set();
    
    jobs.forEach(job => {
      // Check if job title starts with the prefix
      if (job.title.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.add(job.title);
      }
      
      // Check if department starts with the prefix
      if (job.department.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.add(job.department);
      }
      
      // Check if location starts with the prefix
      if (job.location.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.add(job.location);
      }
      
      // Check keywords
      job.keywords.forEach(keyword => {
        if (keyword.toLowerCase().startsWith(prefix.toLowerCase())) {
          suggestions.add(keyword);
        }
      });
    });
    
    res.json(Array.from(suggestions).slice(0, 10));
  } catch (error) {
    console.error('Error getting job suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Type-ahead suggestions endpoint for candidates
app.get('/api/search/suggestions/candidates', async (req, res) => {
  try {
    const { prefix, jobId } = req.query;
    
    if (!prefix || prefix.trim() === '') {
      return res.json([]);
    }
    
    // Build search criteria
    const searchCriteria = {
      $or: [
        { name: new RegExp(`^${prefix}`, 'i') },
        { email: new RegExp(`^${prefix}`, 'i') },
        { skills: new RegExp(`^${prefix}`, 'i') }
      ]
    };
    
    // Add jobId filter if provided
    if (jobId) {
      searchCriteria.jobId = jobId;
    }
    
    // Find matching candidates
    const candidates = await Candidate.find(searchCriteria).limit(10);
    
    // Extract unique suggestions
    const suggestions = new Set();
    
    candidates.forEach(candidate => {
      // Check if name starts with the prefix
      if (candidate.name.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.add(candidate.name);
      }
      
      // Check if email starts with the prefix
      if (candidate.email.toLowerCase().startsWith(prefix.toLowerCase())) {
        suggestions.add(candidate.email);
      }
      
      // Check skills
      candidate.skills.forEach(skill => {
        if (skill.toLowerCase().startsWith(prefix.toLowerCase())) {
          suggestions.add(skill);
        }
      });
    });
    
    res.json(Array.from(suggestions).slice(0, 10));
  } catch (error) {
    console.error('Error getting candidate suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Unified search endpoint for both jobs and candidates
app.get('/api/unified-search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.json({ jobs: [], candidates: [] });
    }
    
    // Normalize the query
    const normalizedQuery = normalizeQuery(query);
    
    // Determine search type based on query pattern
    const jobTitleQuery = isLikelyJobTitle(normalizedQuery);
    
    // Prepare results object
    const results = {
      jobs: [],
      candidates: []
    };
    
    // JOBS SEARCH
    // Try exact title match first (case-insensitive)
    const exactJobMatches = await Job.find({ 
      $or: [
        { title: createExactMatchRegex(query) },
        { searchableTitle: normalizedQuery }
      ]
    }).limit(5);
    
    if (exactJobMatches.length > 0) {
      // We have exact matches, prioritize them
      results.jobs = exactJobMatches;
    } else {
      // Try partial title match next
      const partialTitleMatches = await Job.find({
        title: createPartialMatchRegex(query)
      }).limit(8);
      
      if (partialTitleMatches.length > 0) {
        // We have partial title matches
        results.jobs = partialTitleMatches;
      } else {
        // Fall back to text search
        const jobSearchCriteria = { $text: { $search: query } };
        
        // If query looks like a job title, boost title and department fields
        if (jobTitleQuery) {
          const jobTextMatches = await Job.find(
            jobSearchCriteria,
            { 
              score: { $meta: "textScore" },
              // Boost title matches
              titleMatch: {
                $cond: {
                  if: { $regexMatch: { input: "$title", regex: createPartialMatchRegex(query) } },
                  then: 10,
                  else: 0
                }
              }
            }
          )
          .sort({ titleMatch: -1, score: { $meta: "textScore" } })
          .limit(10);
          
          results.jobs = jobTextMatches;
        } else {
          // Standard text search
          const jobTextMatches = await Job.find(
            jobSearchCriteria,
            { score: { $meta: "textScore" } }
          )
          .sort({ score: { $meta: "textScore" } })
          .limit(5);
          
          results.jobs = jobTextMatches;
        }
      }
    }
    
    // CANDIDATES SEARCH
    // If query doesn't look like a job title, prioritize candidate name matches
    if (!jobTitleQuery) {
      // First try exact name matches (case-insensitive)
      const exactNameMatches = await Candidate.find({
        $or: [
          { name: createExactMatchRegex(query) },
          { searchableName: normalizedQuery }
        ]
      }).limit(5);
      
      if (exactNameMatches.length > 0) {
        results.candidates = exactNameMatches;
      } else {
        // Try partial name matches
        const partialNameMatches = await Candidate.find({
          name: createPartialMatchRegex(query)
        }).limit(8);
        
        if (partialNameMatches.length > 0) {
          results.candidates = partialNameMatches;
        } else {
          // Fall back to text search
          results.candidates = await Candidate.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
          )
          .sort({ score: { $meta: "textScore" } })
          .limit(5);
        }
      }
    } else {
      // Still search candidates but with lower priority when query looks like a job title
      results.candidates = await Candidate.find(
        { $text: { $search: query } },
        { score: { $meta: "textScore" } }
      )
      .sort({ score: { $meta: "textScore" } })
      .limit(3);
    }
    
    // Populate job details for candidates
    if (results.candidates.length > 0) {
      results.candidates = await Candidate.populate(results.candidates, {
        path: 'jobId',
        select: 'title department'
      });
    }
    
    res.json(results);
  } catch (error) {
    console.error('Error performing unified search:', error);
    res.status(500).json({ error: error.message });
  }
});

// Semantic search endpoint using Groq LLM
app.post('/api/search/semantic', async (req, res) => {
  try {
    const { query, collection, limit = 10 } = req.body;
    
    if (!query || !collection) {
      return res.status(400).json({ error: 'Query and collection are required' });
    }
    
    if (!['jobs', 'candidates'].includes(collection)) {
      return res.status(400).json({ error: 'Collection must be either "jobs" or "candidates"' });
    }
    
    // Get all documents from the specified collection
    let documents = [];
    if (collection === 'jobs') {
      documents = await Job.find({}).limit(100);
    } else {
      documents = await Candidate.find({}).limit(100);
    }
    
    // Prepare documents for semantic search
    const formattedDocs = documents.map(doc => {
      const docObj = doc.toObject();
      let content = '';
      
      if (collection === 'jobs') {
        content = `Title: ${docObj.title}\nDepartment: ${docObj.department}\nLocation: ${docObj.location}\nDescription: ${docObj.description}\nRequirements: ${docObj.requirements}`;
      } else {
        content = `Name: ${docObj.name}\nEmail: ${docObj.email}\nResume: ${docObj.resumeText}\nMatch Explanation: ${docObj.matchExplanation}`;
      }
      
      return {
        id: docObj._id.toString(),
        content
      };
    });
    
    // Use Groq to perform semantic search
    const prompt = `
You are a semantic search engine for an HR portal. You need to find the most relevant ${collection} based on the user's query.

User Query: ${query}

Documents to search through:
${formattedDocs.map((doc, index) => `Document ${index + 1} (ID: ${doc.id}):\n${doc.content}`).join('\n\n')}

Return a JSON array of the top ${limit} most relevant document IDs, ordered by relevance. The JSON should be an array of strings, where each string is a document ID.
Example: ["id1", "id2", "id3"]
`;

    const completion = await groqClient.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama3-70b-8192",
      temperature: 0.1,
      max_tokens: 500,
    });

    const responseContent = completion.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Clean up the response to ensure it's valid JSON
      const cleanedResponse = responseContent
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      
      const docIds = JSON.parse(cleanedResponse);
      
      // Fetch the actual documents by ID
      let results = [];
      if (collection === 'jobs') {
        results = await Job.find({ _id: { $in: docIds } });
      } else {
        results = await Candidate.find({ _id: { $in: docIds } });
      }
      
      // Sort results in the same order as the docIds array
      results.sort((a, b) => {
        return docIds.indexOf(a._id.toString()) - docIds.indexOf(b._id.toString());
      });
      
      res.json(results);
    } catch (error) {
      console.error('Error parsing semantic search results:', error);
      res.status(500).json({ error: 'Failed to parse semantic search results' });
    }
  } catch (error) {
    console.error('Error performing semantic search:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new job
app.post('/api/jobs', async (req, res) => {
  try {
    const { title, department, location, description, requirements, status } = req.body;
    
    if (!title || !department || !location || !description || !requirements) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const job = new Job({
      title,
      department,
      location,
      description,
      requirements,
      status: status || 'draft'
    });
    
    await job.save();
    res.status(201).json(job);
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all jobs
app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific job
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload and process resumes for a job
app.post('/api/jobs/:id/candidates/upload', upload.array('resumes', 5), async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Check if jobId is valid
    if (!jobId || jobId === 'undefined' || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    // Check if files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No resume files uploaded' });
    }

    // Limit to 5 files
    if (req.files.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 resume files allowed' });
    }

    // Process each resume
    const processedCandidates = [];
    const errors = [];

    // Process resume with Groq LLM
    const processResumeWithLLM = async (resumeText, jobDescription) => {
      try {
        // Truncate texts to avoid token limits
        const truncatedResumeText = resumeText.substring(0, 3000);
        const truncatedJobDescription = jobDescription.substring(0, 1000);
        
        const prompt = `
You are an AI assistant specialized in analyzing resumes for job applications.

JOB DESCRIPTION:
${truncatedJobDescription}

RESUME TEXT:
${truncatedResumeText}

Based on the resume and job description, extract the following information in JSON format:
1. Candidate's full name
2. Candidate's email address (if available, otherwise return null)
3. A match score (0-100) representing how well the candidate's skills and experience match the job description
4. A brief explanation (2-3 sentences) of the match score

Return ONLY a valid JSON object with the following structure:
{
  "name": "Candidate's full name",
  "email": "candidate@example.com",
  "matchScore": 85,
  "matchExplanation": "Brief explanation of the score"
}
`;

        const completion = await groqClient.chat.completions.create({
          messages: [{ role: "user", content: prompt }],
          model: "llama3-70b-8192",
          temperature: 0.3, // Lower temperature for more consistent results
          max_tokens: 500,  // Limit response size
        });

        const responseContent = completion.choices[0].message.content;
        
        // Parse the JSON response
        try {
          // Clean up the response to ensure it's valid JSON
          const cleanedResponse = responseContent
            .replace(/```json/g, '')
            .replace(/```/g, '')
            .trim();
          
          const parsedResponse = JSON.parse(cleanedResponse);
          
          // Validate the response has the required fields
          if (!parsedResponse.name) {
            parsedResponse.name = "Unknown Candidate";
          }
          
          if (!parsedResponse.matchScore) {
            parsedResponse.matchScore = 50; // Default score
          }
          
          if (!parsedResponse.matchExplanation) {
            parsedResponse.matchExplanation = "Score based on general resume evaluation.";
          }
          
          return {
            name: parsedResponse.name,
            email: parsedResponse.email || `${parsedResponse.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            matchScore: parsedResponse.matchScore,
            matchExplanation: parsedResponse.matchExplanation,
            resumeText: truncatedResumeText.substring(0, 1000) // Store first 1000 chars of resume for reference
          };
        } catch (error) {
          console.error('Error parsing LLM response:', error, 'Raw response:', responseContent);
          // Return default values instead of throwing an error
          return {
            name: "Unknown Candidate",
            email: "unknown.candidate@example.com",
            matchScore: 50,
            matchExplanation: "Unable to analyze resume properly. Score is an estimate.",
            resumeText: truncatedResumeText.substring(0, 1000)
          };
        }
      } catch (error) {
        console.error('Error processing with Groq LLM:', error);
        // Return default values instead of throwing an error
        return {
          name: "Unknown Candidate",
          email: "unknown.candidate@example.com",
          matchScore: 50,
          matchExplanation: "Unable to analyze resume due to technical issues. Score is an estimate.",
          resumeText: resumeText.substring(0, 1000)
        };
      }
    };

    // Process each resume file
    for (const file of req.files) {
      try {
        const pdfBuffer = fs.readFileSync(file.path);
        const data = await pdfParse(pdfBuffer);
        const resumeText = data.text;

        // Process with Groq LLM
        const candidateData = await processResumeWithLLM(resumeText, job.description);
        
        // Add file path to candidate data
        candidateData.resumeUrl = file.path;
        
        // Save candidate to database
        const candidate = new Candidate({
          jobId,
          name: candidateData.name,
          email: candidateData.email,
          atsScore: candidateData.matchScore,
          matchExplanation: candidateData.matchExplanation,
          resumeUrl: candidateData.resumeUrl,
          resumeText: candidateData.resumeText
        });
        
        await candidate.save();
        processedCandidates.push(candidate);
      } catch (error) {
        console.error('Error processing resume:', error);
        errors.push({
          filename: file.originalname,
          error: error.message || 'Failed to process the uploaded resume'
        });
      }
    }

    // Return results
    res.json({
      success: processedCandidates.length > 0,
      candidates: processedCandidates,
      errors: errors,
      total: req.files.length,
      processed: processedCandidates.length,
      failed: errors.length
    });
  } catch (error) {
    console.error('Error processing resumes:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get candidates for a job
app.get('/api/jobs/:id/candidates', async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Check if jobId is valid
    if (!jobId || jobId === 'undefined' || !mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ error: 'Invalid job ID' });
    }
    
    const candidates = await Candidate.find({ jobId }).sort({ createdAt: -1 });
    res.json(candidates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule a call
app.post('/api/candidates/:id/schedule', async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    // Check if candidateId is valid
    if (!candidateId || !mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ error: 'Invalid candidate ID' });
    }
    
    // Find and update the candidate
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    candidate.interviewScheduled = true;
    candidate.interviewDate = req.body.interviewDate || new Date();
    
    await candidate.save();
    
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Email sending endpoint
app.post('/api/send-email', async (req, res) => {
  try {
    const { name, email, jobRole } = req.body;
    
    // Validate required fields
    if (!name || !email || !jobRole) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if SMTP credentials are properly configured
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || 
        process.env.SMTP_PASS === 'your-16-character-app-password') {
      console.error('SMTP credentials not properly configured');
      return res.status(500).json({ 
        error: 'Email service not properly configured', 
        details: 'Please set up valid SMTP credentials in the .env file' 
      });
    }
    
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    // Email content
    const mailOptions = {
      from: `"${process.env.COMPANY_NAME || 'HR Team'}" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `Interview Invitation for ${jobRole}`,
      text: `Dear ${name},

We are pleased to invite you for an interview for the position of ${jobRole}.
Please reply to this email to confirm your availability.

Best Regards,
${process.env.COMPANY_NAME || 'HR Team'}`,
      html: `<p>Dear ${name},</p>
<p>We are pleased to invite you for an interview for the position of <strong>${jobRole}</strong>.</p>
<p>Please reply to this email to confirm your availability.</p>
<p>Best Regards,<br/>
${process.env.COMPANY_NAME || 'HR Team'}</p>`
    };
    
    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    
    res.status(200).json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ 
      error: 'Failed to send email', 
      details: error.message,
      solution: error.code === 'EAUTH' ? 
        'Authentication failed. Please check your SMTP credentials and make sure you\'re using an App Password for Gmail.' : 
        'Check server logs for details'
    });
  }
});

// AI agent endpoint
app.post('/api/ai-agent', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }
    
    // Use Groq to process the prompt
    const completion = await groqClient.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant participating in an audio conference. Provide helpful, concise, and informative responses to user queries." 
        },
        { 
          role: "user", 
          content: prompt 
        }
      ],
      model: "llama3-70b-8192",
      temperature: 0.7,
      max_tokens: 800,
    });
    
    const response = completion.choices[0].message.content;
    
    // In a real implementation, you would use text-to-speech to convert this response
    // to audio and play it in the LiveKit room. For now, we'll just return the text.
    res.json({ response });
  } catch (error) {
    console.error('Error processing AI prompt:', error);
    res.status(500).json({ error: error.message });
  }
});

// LiveKit token generation
const createToken = async (identity, roomName) => {
  // If this room doesn't exist, it'll be automatically created when the first
  // participant joins
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new Error('LiveKit API key and secret must be set in environment variables');
  }
  
  const at = new AccessToken(apiKey, apiSecret, {
    identity,
    // Token to expire after 24 hours
    ttl: '24h',
  });

  // Add permissions for the participant
  at.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true
  });

  return await at.toJwt();
};

// LiveKit token endpoint
app.get('/api/livekit/token', async (req, res) => {
  try {
    const { identity, room } = req.query;
    
    if (!identity || !room) {
      return res.status(400).json({ error: 'Missing identity or room parameters' });
    }
    
    const token = await createToken(identity, room);
    res.json({ token });
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ error: error.message });
  }
});

// Authentication Routes
// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      fullName,
      email,
      password
    });

    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get current user (protected route)
app.get('/api/auth/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { Groq } from 'groq-sdk';
import pdfParse from 'pdf-parse';
import nodemailer from 'nodemailer';
import Job from './models/Job.js';
import Candidate from './models/Candidate.js';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
app.post('/api/jobs/:id/candidates/upload', upload.single('resume'), async (req, res) => {
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
    
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No resume file uploaded' });
    }

    try {
      const pdfBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(pdfBuffer);
      const resumeText = data.text;

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

      try {
        // Process with Groq LLM
        const candidateData = await processResumeWithLLM(resumeText, job.description);
        
        // Add file path to candidate data
        candidateData.resumeUrl = req.file.path;
        
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
        
        res.json(candidate);
      } catch (error) {
        console.error('Error processing resume:', error);
        res.status(400).json({ error: 'Failed to process the uploaded resume' });
      }
    } catch (error) {
      console.error('Error processing resume:', error);
      res.status(400).json({ error: error.message });
    }
  } catch (error) {
    console.error('Error processing resume:', error);
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
    // Token to expire after 10 minutes
    ttl: '10m',
  });
  at.addGrant({ roomJoin: true, room: roomName });

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

// Serve static files from the React app
app.use(express.static(join(__dirname, '../dist')));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../dist/index.html'));
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parseDprExcelWorkbook } from './src/parser/excelParser.js';
import { validateAndNormalizeConvergenceData } from './src/parser/convergenceSchema.js';
import { generateDprProjections } from './src/engine/dprEngine.js';
import { generateDprExcelWorkbook } from './src/export/excelExportEngine.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Configure in-memory file uploads with 20MB limit and Excel extension validation
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.xlsm'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${ext}". Only Excel spreadsheets (.xlsx, .xls) are accepted.`));
    }
  }
});

// Dynamic CORS configuration supporting local dev, Vercel deployments, and custom domains
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || 
      origin.endsWith('.vercel.app') ||
      origin.startsWith('http://localhost:');

    if (isAllowed) return callback(null, true);
    return callback(null, true);
  },
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'MSME CreditOS Engine API', 
    version: '0.2.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------------------------------------------------
// DPR ENGINE API ENDPOINTS (Phase 2 & Phase 3)
// -------------------------------------------------------------

/**
 * POST /api/dpr/parse-excel
 * Accepts a multipart/form-data upload with an Excel file (.xlsx, .xls)
 * Runs Phase 2 Excel Parser and returns extracted and normalized data.
 */
app.post('/api/dpr/parse-excel', upload.single('file'), (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        error: 'No Excel file uploaded. Please attach a valid .xlsx or .xls file.'
      });
    }

    const parseResult = parseDprExcelWorkbook(req.file.buffer);

    if (!parseResult || !parseResult.validation || !parseResult.validation.isValid) {
      return res.status(422).json({
        success: false,
        fileName: req.file.originalname,
        error: parseResult?.validation?.errors?.[0] || 'Failed to extract valid financial statements from uploaded workbook.',
        validation: parseResult?.validation
      });
    }

    return res.json({
      success: true,
      fileName: req.file.originalname,
      rawExtracted: parseResult.rawExtracted,
      normalizedData: parseResult.normalizedData,
      validation: parseResult.validation
    });
  } catch (err) {
    console.error('Error parsing uploaded Excel:', err);
    return res.status(500).json({
      success: false,
      error: `Server parsing error: ${err.message}`
    });
  }
});

/**
 * GET /api/dpr/sample
 * Parses Sir's actual CA project report file on disk and returns its normalized review data
 * Enables instant one-click testing of real-world CA data.
 */
app.get('/api/dpr/sample', (req, res) => {
  try {
    const candidatePaths = [
      path.resolve('data/sample_cma.xlsx'),
      path.resolve('server/data/sample_cma.xlsx'),
      path.resolve('../server/data/sample_cma.xlsx'),
      process.env.SAMPLE_DPR_PATH,
      'C:\\Users\\Nitro 5\\Downloads\\Final Project Report 25-04-23 - Email.xlsx'
    ].filter(Boolean);

    const targetPath = candidatePaths.find(p => fs.existsSync(p));
    if (!targetPath) {
      return res.status(404).json({
        success: false,
        error: 'Sample CA report file not found on server.'
      });
    }

    const parseResult = parseDprExcelWorkbook(targetPath);
    return res.json({
      success: true,
      fileName: 'Final Project Report 25-04-23 - Email.xlsx',
      rawExtracted: parseResult.rawExtracted,
      normalizedData: parseResult.normalizedData,
      validation: parseResult.validation
    });
  } catch (err) {
    console.error('Error loading sample DPR:', err);
    return res.status(500).json({
      success: false,
      error: `Failed to load sample DPR: ${err.message}`
    });
  }
});

/**
 * POST /api/dpr/generate
 * Accepts confirmed data object from Review Screen, executes Phase 1 Math Engine,
 * and returns full multi-year DPR projections.
 */
app.post('/api/dpr/generate', (req, res) => {
  try {
    const candidateData = req.body;
    if (!candidateData || typeof candidateData !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body. Expected normalized financial data object.'
      });
    }

    // Run convergence schema validation and guardrails
    const validation = validateAndNormalizeConvergenceData(candidateData);

    if (!validation.isValid) {
      return res.status(422).json({
        success: false,
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Execute Phase 1 Math Engine
    const dprProjections = generateDprProjections(validation.normalizedData);

    return res.json({
      success: true,
      dpr: dprProjections,
      normalizedData: validation.normalizedData,
      warnings: validation.warnings,
      confidenceScore: validation.confidenceScore
    });
  } catch (err) {
    console.error('Error generating DPR projections:', err);
    return res.status(500).json({
      success: false,
      error: `Engine execution failure: ${err.message}`
    });
  }
});

/**
 * POST /api/dpr/export-excel
 * Generates an institutional multi-sheet Excel workbook (.xlsx) and streams it as a download.
 * Accepts either:
 * 1) { dpr, normalizedData } directly (if already computed by frontend)
 * 2) Candidate data object (validates and runs engine on the fly)
 */
app.post('/api/dpr/export-excel', async (req, res) => {
  try {
    let dpr = req.body?.dpr;
    let normalizedData = req.body?.normalizedData;

    const isValidDpr = dpr && typeof dpr === 'object' && dpr.metadata && Array.isArray(dpr.projectedPnl);

    if (!isValidDpr) {
      // Validate and compute DPR on the fly
      const candidateData = req.body || {};
      const validation = validateAndNormalizeConvergenceData(candidateData);
      if (!validation.isValid) {
        return res.status(422).json({
          success: false,
          errors: validation.errors,
          warnings: validation.warnings
        });
      }
      normalizedData = validation.normalizedData;
      dpr = generateDprProjections(normalizedData);
    }

    const buffer = await generateDprExcelWorkbook({ dpr, normalizedData });
    const rawName = normalizedData?.entityName || dpr?.metadata?.entityName || 'MSME_Borrower';
    const sanitizedName = rawName.replace(/[^a-zA-Z0-9_\-\s]/g, '_').trim().replace(/\s+/g, '_') || 'MSME_Borrower';
    const fileName = `DPR_${sanitizedName}_Bank_Projections.xlsx`;
    const encodedFileName = encodeURIComponent(fileName);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${encodedFileName}`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('Error generating Excel export:', err);
    return res.status(500).json({
      success: false,
      error: `Excel export failed: ${err.message}`
    });
  }
});

/**
 * GET /api/dpr/sample-export
 * Convenience endpoint: parses sample CA workbook, generates DPR, and streams bank-ready .xlsx
 */
app.get('/api/dpr/sample-export', async (req, res) => {
  try {
    const candidatePaths = [
      path.resolve('data/sample_cma.xlsx'),
      path.resolve('server/data/sample_cma.xlsx'),
      path.resolve('../server/data/sample_cma.xlsx')
    ];
    const targetPath = candidatePaths.find(p => fs.existsSync(p));
    if (!targetPath) {
      return res.status(404).json({ success: false, error: 'Sample workbook not found on server' });
    }

    const parseResult = parseDprExcelWorkbook(targetPath);
    const validation = validateAndNormalizeConvergenceData({
      ...parseResult.normalizedData,
      horizonYears: 5
    });
    const dpr = generateDprProjections(validation.normalizedData);
    const buffer = await generateDprExcelWorkbook({ dpr, normalizedData: validation.normalizedData });

    const fileName = 'DPR_Shree_Enterprises_Bank_Projections.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', buffer.length);
    return res.send(buffer);
  } catch (err) {
    console.error('Error exporting sample Excel:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Global error handling middleware (catches Multer errors, file rejections, JSON body errors)
app.use((err, req, res, next) => {
  console.error('Express API error:', err.message);
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'Uploaded file exceeds the maximum permitted size of 20MB.'
      });
    }
    return res.status(400).json({
      success: false,
      error: `Upload error: ${err.message}`
    });
  }

  return res.status(err.status || 400).json({
    success: false,
    error: err.message || 'An unexpected error occurred processing your request.'
  });
});

// Bind to 0.0.0.0 for cloud container compatibility
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`MSME CreditOS server listening on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: shutting down HTTP server gracefully');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

import { asyncHandler } from '../utils/asyncHandler.js';
import { scanUrl, scanHtml, ScanError } from '../services/webAnalyzerService.js';

const handleScanError = (res, error) => {
  if (error instanceof ScanError) {
    return res.status(error.status || 400).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
  }
  throw error;
};

export const scanPortfolioUrl = asyncHandler(async (req, res) => {
  try {
    const analysis = await scanUrl(req.body.url, { categories: req.body.categories });
    res.json({ success: true, data: { analysis } });
  } catch (error) {
    return handleScanError(res, error);
  }
});

export const scanPortfolioHtml = asyncHandler(async (req, res) => {
  try {
    const analysis = scanHtml(req.body.html, {
      filename: req.body.filename,
      categories: req.body.categories,
    });
    res.json({ success: true, data: { analysis } });
  } catch (error) {
    return handleScanError(res, error);
  }
});

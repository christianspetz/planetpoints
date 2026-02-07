const { VALID_MATERIALS } = require('../config/materials');

function validateLog(req, res, next) {
  const { material_type, item_count } = req.body;

  if (!material_type || !VALID_MATERIALS.includes(material_type)) {
    return res.status(422).json({ success: false, error: 'Pick a material from the list.' });
  }

  const count = Number(item_count);
  if (!Number.isInteger(count)) {
    return res.status(422).json({ success: false, error: 'Please enter a whole number.' });
  }
  if (count < 1) {
    return res.status(422).json({ success: false, error: 'Oops! Log at least 1 item.' });
  }
  if (count > 999) {
    return res.status(422).json({ success: false, error: "Whoa, that's a LOT! Max 999 per entry." });
  }

  req.body.item_count = count;
  next();
}

function validateRegister(req, res, next) {
  const { email, password, display_name } = req.body;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(422).json({ success: false, error: 'Please enter a valid email address.' });
  }

  if (!password || password.length < 8 || !/\d/.test(password)) {
    return res.status(422).json({
      success: false,
      error: 'Password must be at least 8 characters with at least 1 number.',
    });
  }

  if (!display_name || display_name.trim().length < 2 || display_name.trim().length > 50) {
    return res.status(422).json({
      success: false,
      error: 'Display name must be 2–50 characters.',
    });
  }

  if (!/^[a-zA-Z0-9 ]+$/.test(display_name.trim())) {
    return res.status(422).json({
      success: false,
      error: 'Display name can only contain letters, numbers, and spaces.',
    });
  }

  req.body.email = email.toLowerCase().trim();
  req.body.display_name = display_name.trim();
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ success: false, error: 'Email and password are required.' });
  }
  req.body.email = email.toLowerCase().trim();
  next();
}

function validateProfile(req, res, next) {
  const { display_name } = req.body;
  if (display_name !== undefined) {
    if (!display_name || display_name.trim().length < 2 || display_name.trim().length > 50) {
      return res.status(422).json({
        success: false,
        error: 'Display name must be 2–50 characters.',
      });
    }
    if (!/^[a-zA-Z0-9 ]+$/.test(display_name.trim())) {
      return res.status(422).json({
        success: false,
        error: 'Display name can only contain letters, numbers, and spaces.',
      });
    }
    req.body.display_name = display_name.trim();
  }
  next();
}

module.exports = { validateLog, validateRegister, validateLogin, validateProfile };

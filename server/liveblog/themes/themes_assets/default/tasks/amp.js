const amphtmlValidator = require('amphtml-validator');
const { BUILD_HTML } = require('./constants');

/**
 * Validate if AMP markup is valid
 * From: https://github.com/uncompiled/amp-bootstrap-example/
 */
const ampValidate = () => {
  amphtmlValidator.getInstance().then((validator) => {
    var input = fs.readFileSync(BUILD_HTML, 'utf8');
    var result = validator.validateString(input);
    (result.status === 'PASS' ? console.info : console.error)(BUILD_HTML + ": " + result.status);

    for (var ii = 0; ii < result.errors.length; ii++) {
      var error = result.errors[ii];
      var msg = 'line ' + error.line + ', col ' + error.col + ': ' + error.message;
      if (error.specUrl !== null) {
        msg += ' (see ' + error.specUrl + ')';
      }
      (error.severity === 'ERROR' ? console.error : console.warn)(msg);
    }
  });
}

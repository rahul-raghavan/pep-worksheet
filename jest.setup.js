if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

const { Request, Response, Headers } = require('node-fetch');
global.Request = Request;
global.Response = Response;
global.Headers = Headers;

import '@testing-library/jest-dom'; 
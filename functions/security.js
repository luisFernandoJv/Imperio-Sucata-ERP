const { HttpsError } = require("firebase-functions/v2/https");

function requireAuthenticated(request) {
  if (
    !request?.auth ||
    typeof request.auth.uid !== "string" ||
    !request.auth.uid
  ) {
    throw new HttpsError("unauthenticated", "É necessário entrar no sistema.");
  }
  return request.auth;
}

function requireAdmin(request) {
  const auth = requireAuthenticated(request);
  if (auth.token?.admin !== true) {
    throw new HttpsError(
      "permission-denied",
      "Esta operação exige acesso administrativo.",
    );
  }
  return auth;
}

module.exports = { requireAuthenticated, requireAdmin };

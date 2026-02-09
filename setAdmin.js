/**
 * Script para definir custom claims de administrador
 *
 * USO:
 * 1. Instale as dependências: npm install
 * 2. Execute: node setAdmin.js EMAIL_DO_USUARIO
 *
 * EXEMPLO:
 * node setAdmin.js admin@exemplo.com
 */

const admin = require("firebase-admin");

// Inicializar Firebase Admin
admin.initializeApp();

// Pegar email do argumento da linha de comando
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("❌ Erro: Email do usuário é obrigatório");
  console.log("Uso: node setAdmin.js EMAIL_DO_USUARIO");
  console.log("Exemplo: node setAdmin.js admin@exemplo.com");
  process.exit(1);
}

async function setAdminClaim(email) {
  try {
    console.log(`🔍 Buscando usuário: ${email}...`);

    // Buscar usuário por email
    const user = await admin.auth().getUserByEmail(email);

    console.log(`✅ Usuário encontrado: ${user.uid}`);
    console.log(`   Nome: ${user.displayName || "N/A"}`);
    console.log(`   Email: ${user.email}`);
    console.log(
      `   Criado em: ${new Date(user.metadata.creationTime).toLocaleString()}`,
    );

    // Definir custom claim
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });

    console.log("✅ Claims de administrador definidas com sucesso!");
    console.log("");
    console.log("⚠️  IMPORTANTE:");
    console.log("   O usuário precisa fazer logout e login novamente para");
    console.log("   que as novas permissões sejam aplicadas.");
    console.log("");
    console.log("   Para verificar as claims:");
    console.log(`   node verifyAdmin.js ${email}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao definir claims de admin:", error.message);

    if (error.code === "auth/user-not-found") {
      console.log("");
      console.log(
        "💡 Dica: Certifique-se de que o usuário existe no Firebase Authentication",
      );
      console.log(
        "   Acesse: https://console.firebase.google.com/project/_/authentication/users",
      );
    }

    process.exit(1);
  }
}

// Executar
setAdminClaim(userEmail);

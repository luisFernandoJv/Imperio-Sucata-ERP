/**
 * Script para verificar custom claims de um usuário
 *
 * USO:
 * node verifyAdmin.js EMAIL_DO_USUARIO
 *
 * EXEMPLO:
 * node verifyAdmin.js admin@exemplo.com
 */

const admin = require("firebase-admin");

// Inicializar Firebase Admin
admin.initializeApp();

// Pegar email do argumento da linha de comando
const userEmail = process.argv[2];

if (!userEmail) {
  console.error("❌ Erro: Email do usuário é obrigatório");
  console.log("Uso: node verifyAdmin.js EMAIL_DO_USUARIO");
  process.exit(1);
}

async function verifyAdminClaim(email) {
  try {
    console.log(`🔍 Verificando usuário: ${email}...`);

    // Buscar usuário por email
    const user = await admin.auth().getUserByEmail(email);

    console.log("");
    console.log("📋 INFORMAÇÕES DO USUÁRIO:");
    console.log("─".repeat(50));
    console.log(`   UID: ${user.uid}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nome: ${user.displayName || "N/A"}`);
    console.log(`   Email verificado: ${user.emailVerified ? "Sim" : "Não"}`);
    console.log(`   Desabilitado: ${user.disabled ? "Sim" : "Não"}`);
    console.log(
      `   Criado em: ${new Date(user.metadata.creationTime).toLocaleString()}`,
    );
    console.log(
      `   Último login: ${user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleString() : "Nunca"}`,
    );
    console.log("");

    console.log("🔐 CUSTOM CLAIMS:");
    console.log("─".repeat(50));

    if (user.customClaims && Object.keys(user.customClaims).length > 0) {
      Object.entries(user.customClaims).forEach(([key, value]) => {
        console.log(`   ${key}: ${value}`);
      });

      if (user.customClaims.admin === true) {
        console.log("");
        console.log("✅ Este usuário TEM permissões de administrador");
      } else {
        console.log("");
        console.log("⚠️  Este usuário NÃO tem permissões de administrador");
      }
    } else {
      console.log("   Nenhuma custom claim definida");
      console.log("");
      console.log("⚠️  Este usuário NÃO tem permissões de administrador");
      console.log("");
      console.log("Para definir como admin, execute:");
      console.log(`   node setAdmin.js ${email}`);
    }

    console.log("");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro ao verificar claims:", error.message);

    if (error.code === "auth/user-not-found") {
      console.log("");
      console.log("💡 Usuário não encontrado no Firebase Authentication");
    }

    process.exit(1);
  }
}

// Executar
verifyAdminClaim(userEmail);

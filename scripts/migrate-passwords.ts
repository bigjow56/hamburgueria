import { db } from '../server/db';
import { users, adminUsers } from '../shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function migratePasswords() {
  console.log('🔐 Iniciando migração de senhas para bcrypt...');
  
  try {
    // Migrate admin users passwords
    console.log('📋 Migrando senhas dos administradores...');
    const admins = await db.select().from(adminUsers);
    
    let adminMigrated = 0;
    for (const admin of admins) {
      // Check if password is already hashed (bcrypt hashes start with $2a$ or $2b$)
      if (!admin.password.startsWith('$2a$') && !admin.password.startsWith('$2b$')) {
        console.log(`  🔄 Migrando senha do admin: ${admin.username}`);
        
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        
        await db
          .update(adminUsers)
          .set({ password: hashedPassword })
          .where(eq(adminUsers.id, admin.id));
        
        adminMigrated++;
        console.log(`  ✅ Senha do admin ${admin.username} migrada com sucesso`);
      } else {
        console.log(`  ⏭️  Admin ${admin.username} já possui senha hasheada`);
      }
    }
    
    // Migrate regular users passwords
    console.log('👥 Migrando senhas dos usuários...');
    const allUsers = await db.select().from(users);
    
    let usersMigrated = 0;
    for (const user of allUsers) {
      // Check if password is already hashed
      if (!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')) {
        console.log(`  🔄 Migrando senha do usuário: ${user.name} (${user.phone})`);
        
        const hashedPassword = await bcrypt.hash(user.password, 12);
        
        await db
          .update(users)
          .set({ password: hashedPassword })
          .where(eq(users.id, user.id));
        
        usersMigrated++;
        console.log(`  ✅ Senha do usuário ${user.name} migrada com sucesso`);
      } else {
        console.log(`  ⏭️  Usuário ${user.name} já possui senha hasheada`);
      }
    }
    
    console.log('\n🎉 Migração concluída com sucesso!');
    console.log(`📊 Resumo:`);
    console.log(`   - Admins migrados: ${adminMigrated}/${admins.length}`);
    console.log(`   - Usuários migrados: ${usersMigrated}/${allUsers.length}`);
    console.log(`   - Total migrado: ${adminMigrated + usersMigrated}/${admins.length + allUsers.length}`);
    
    if (adminMigrated + usersMigrated === 0) {
      console.log('✨ Todas as senhas já estavam seguras!');
    } else {
      console.log('🔒 Todas as senhas agora estão protegidas com bcrypt!');
    }
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  }
}

// Execute migration directly
migratePasswords()
  .then(() => {
    console.log('✅ Script de migração executado com sucesso');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  });

export { migratePasswords };
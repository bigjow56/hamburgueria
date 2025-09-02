#!/usr/bin/env tsx

import { db } from "../server/db";
import { bannerThemes } from "@shared/schema";

const blackFridayHTML = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Black Friday - Burger House</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Arial', sans-serif;
            background: #f5f5f5;
            padding: 20px;
        }

        .black-friday-banner {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #000000 100%);
            border-radius: 20px;
            padding: 40px 30px;
            position: relative;
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0,0,0,0.3);
            margin: 20px 0;
            animation: glow 2s ease-in-out infinite alternate;
        }

        @keyframes glow {
            from { box-shadow: 0 20px 40px rgba(0,0,0,0.3), 0 0 20px rgba(255,215,0,0.2); }
            to { box-shadow: 0 25px 50px rgba(0,0,0,0.4), 0 0 40px rgba(255,215,0,0.4); }
        }

        .banner-bg-decoration {
            position: absolute;
            top: -50%;
            right: -20%;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(255,215,0,0.1) 0%, transparent 70%);
            border-radius: 50%;
            animation: float 6s ease-in-out infinite;
        }

        .banner-bg-decoration:nth-child(2) {
            top: 60%;
            left: -10%;
            animation-delay: -3s;
        }

        @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(180deg); }
        }

        .banner-content {
            position: relative;
            z-index: 2;
            text-align: center;
        }

        .black-friday-title {
            font-size: 3.5rem;
            font-weight: 900;
            background: linear-gradient(45deg, #FFD700, #FFA500, #FF6B35);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin-bottom: 10px;
            animation: shimmer 3s ease-in-out infinite;
        }

        @keyframes shimmer {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
        }

        .subtitle {
            color: #ffffff;
            font-size: 1.2rem;
            margin-bottom: 25px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .discount-container {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 20px;
            margin: 30px 0;
            flex-wrap: wrap;
        }

        .discount-badge {
            background: linear-gradient(135deg, #FF6B35, #FF8E53);
            color: white;
            padding: 15px 25px;
            border-radius: 50px;
            font-size: 2rem;
            font-weight: bold;
            box-shadow: 0 8px 20px rgba(255,107,53,0.3);
            animation: bounce 2s infinite;
        }

        @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-10px); }
            60% { transform: translateY(-5px); }
        }

        .offer-text {
            color: #FFD700;
            font-size: 1.5rem;
            font-weight: bold;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
        }

        .cta-buttons {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin-top: 30px;
            flex-wrap: wrap;
        }

        .btn {
            padding: 15px 30px;
            border: none;
            border-radius: 50px;
            font-size: 1.1rem;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            position: relative;
            overflow: hidden;
        }

        .btn-primary {
            background: linear-gradient(135deg, #28a745, #20c997);
            color: white;
            box-shadow: 0 8px 20px rgba(40,167,69,0.3);
        }

        .btn-secondary {
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: #1a1a1a;
            box-shadow: 0 8px 20px rgba(255,215,0,0.3);
        }

        .btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.2);
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }

        .btn:hover::before {
            left: 100%;
        }

        .countdown-timer {
            background: rgba(255,255,255,0.1);
            border-radius: 15px;
            padding: 15px;
            margin-top: 25px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
        }

        .timer-text {
            color: #FFD700;
            font-size: 1rem;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .timer-display {
            display: flex;
            justify-content: center;
            gap: 15px;
            flex-wrap: wrap;
        }

        .timer-unit {
            background: rgba(0,0,0,0.5);
            padding: 10px 15px;
            border-radius: 10px;
            text-align: center;
            min-width: 60px;
        }

        .timer-number {
            color: #FFD700;
            font-size: 1.5rem;
            font-weight: bold;
            display: block;
        }

        .timer-label {
            color: #ffffff;
            font-size: 0.8rem;
            text-transform: uppercase;
        }

        .fire-emoji {
            font-size: 2rem;
            animation: fireFlicker 1s ease-in-out infinite alternate;
        }

        @keyframes fireFlicker {
            0% { transform: scale(1) rotate(-2deg); }
            100% { transform: scale(1.1) rotate(2deg); }
        }

        @media (max-width: 768px) {
            .black-friday-title {
                font-size: 2.5rem;
                letter-spacing: 2px;
            }
            
            .discount-container {
                flex-direction: column;
                gap: 15px;
            }
            
            .discount-badge {
                font-size: 1.5rem;
                padding: 12px 20px;
            }
            
            .cta-buttons {
                flex-direction: column;
                align-items: center;
            }
            
            .btn {
                width: 100%;
                max-width: 300px;
            }
        }
    </style>
</head>
<body>
    <div class="black-friday-banner">
        <div class="banner-bg-decoration"></div>
        <div class="banner-bg-decoration"></div>
        
        <div class="banner-content">
            <h1 class="black-friday-title">Black Friday</h1>
            <p class="subtitle">🔥 Os Melhores Hambúrguers com Desconto Imperdível! 🔥</p>
            
            <div class="discount-container">
                <div class="discount-badge">ATÉ 50% OFF</div>
                <div class="offer-text">nos Mais Vendidos</div>
            </div>
            
            <div class="cta-buttons">
                <a href="#cardapio" class="btn btn-primary">🍔 VER OFERTAS</a>
                <a href="#whatsapp" class="btn btn-secondary">📱 PEDIR AGORA</a>
            </div>
            
            <div class="countdown-timer">
                <div class="timer-text">⏰ Oferta por tempo limitado</div>
                <div class="timer-display">
                    <div class="timer-unit">
                        <span class="timer-number" id="days">2</span>
                        <span class="timer-label">Dias</span>
                    </div>
                    <div class="timer-unit">
                        <span class="timer-number" id="hours">14</span>
                        <span class="timer-label">Horas</span>
                    </div>
                    <div class="timer-unit">
                        <span class="timer-number" id="minutes">35</span>
                        <span class="timer-label">Min</span>
                    </div>
                    <div class="timer-unit">
                        <span class="timer-number" id="seconds">42</span>
                        <span class="timer-label">Seg</span>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Countdown timer animation
        function updateTimer() {
            const days = Math.floor(Math.random() * 3) + 1;
            const hours = Math.floor(Math.random() * 24);
            const minutes = Math.floor(Math.random() * 60);
            const seconds = Math.floor(Math.random() * 60);
            
            document.getElementById('days').textContent = days.toString().padStart(2, '0');
            document.getElementById('hours').textContent = hours.toString().padStart(2, '0');
            document.getElementById('minutes').textContent = minutes.toString().padStart(2, '0');
            document.getElementById('seconds').textContent = seconds.toString().padStart(2, '0');
        }

        // Update timer every second for demo
        setInterval(updateTimer, 1000);
        updateTimer();

        // Add click animations
        document.querySelectorAll('.btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                
                // Create ripple effect
                const ripple = document.createElement('span');
                ripple.style.position = 'absolute';
                ripple.style.width = '20px';
                ripple.style.height = '20px';
                ripple.style.background = 'rgba(255,255,255,0.5)';
                ripple.style.borderRadius = '50%';
                ripple.style.transform = 'scale(0)';
                ripple.style.animation = 'ripple 0.6s linear';
                ripple.style.left = (e.offsetX - 10) + 'px';
                ripple.style.top = (e.offsetY - 10) + 'px';
                
                this.appendChild(ripple);
                
                setTimeout(() => {
                    ripple.remove();
                }, 600);
                
                // Simulate action
                console.log('Botão clicado:', this.textContent);
            });
        });

        // Add ripple animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;

async function seedBannerThemes() {
  try {
    console.log("🎨 Iniciando seed dos temas de banner...");

    // Inserir o banner da Black Friday
    const [blackFridayBanner] = await db.insert(bannerThemes).values({
      name: "Black Friday",
      isCustomizable: false,
      htmlContent: blackFridayHTML,
      isActive: false, // Inicialmente inativo
    }).returning();

    console.log(`✅ Banner "${blackFridayBanner.name}" criado com sucesso!`);
    console.log(`   ID: ${blackFridayBanner.id}`);
    console.log(`   Nome: ${blackFridayBanner.name}`);
    console.log(`   Customizável: ${blackFridayBanner.isCustomizable ? 'Sim' : 'Não'}`);
    console.log(`   Status: ${blackFridayBanner.isActive ? 'Ativo' : 'Inativo'}`);

    console.log("\n🎉 Seed concluído com sucesso!");
    console.log("\n💡 Para ativar o banner, use a API:");
    console.log(`   PUT /api/banners/${blackFridayBanner.id}/activate`);

  } catch (error) {
    console.error("❌ Erro ao executar seed dos banners:", error);
    throw error;
  }
}

// Executar o seed automaticamente
seedBannerThemes()
  .then(() => {
    console.log("\n✨ Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Falha na execução do script:", error);
    process.exit(1);
  });

export { seedBannerThemes };
// ================================
// 🔗 NAVEGAÇÃO E SCROLL
// ================================
const entrarSistema = () => window.location.href = "index.html";

const scrollFeatures = () => {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
};

// ================================
// 🎯 ANIMAÇÃO AO SCROLL (CARDS)
// ================================
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15 // Dispara quando 15% do card estiver visível
};

const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      obs.unobserve(entry.target); // Para de observar após animar (Performance)
    }
  });
}, observerOptions);

document.querySelectorAll('.feature-card').forEach(el => observer.observe(el));

// ================================
// 💎 LOADER INICIAL
// ================================
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.style.display = "none", 500);
  }
});

// ================================
// 🖱️ EFEITOS DE MOUSE (APENAS DESKTOP)
// ================================
// Verifica se é um dispositivo touch (celular/tablet)
const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;

if (!isTouchDevice) {
  
  // 1. Cursor Customizado
  const cursor = document.createElement("div");
  cursor.classList.add("custom-cursor");
  document.body.appendChild(cursor);

  let mouseX = 0, mouseY = 0;
  
  // 2. Parallax no Hero e Atualização do Cursor
  const heroContent = document.querySelector(".hero-content");
  
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    // Atualiza posição do cursor via requestAnimationFrame para não travar a tela
    requestAnimationFrame(() => {
      cursor.style.left = `${mouseX}px`;
      cursor.style.top = `${mouseY}px`;
      
      // Efeito Parallax mais suave, movendo apenas o texto, não a section inteira
      if (heroContent) {
        const x = (window.innerWidth / 2 - mouseX) / 60;
        const y = (window.innerHeight / 2 - mouseY) / 60;
        heroContent.style.transform = `translate(${x}px, ${y}px)`;
      }
    });
  });

  // 3. Efeito Hover Magnético
  document.querySelectorAll(".btn, .feature-card").forEach(el => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      // Remove a transição do CSS temporalmente para o hover magnético ser instantâneo
      el.style.transition = 'none';
      el.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
    });

    el.addEventListener("mouseleave", () => {
      // Limpa os estilos inline para devolver o controle para o CSS original
      el.style.transition = '';
      el.style.transform = '';
    });
  });
}


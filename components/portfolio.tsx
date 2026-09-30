import { Crown, ArrowUpRight, ShieldCheck, CalendarDays, Sparkles } from 'lucide-react';

export default function Portfolio() {
  return (
    <main className="portfolio">
      <a className="skip-link" href="#conteudo">
        Pular para o conteúdo
      </a>
      <header className="portfolio-nav">
        <a href="/apresentacao/" className="portfolio-brand">
          <Crown /> Reino Financeiro
        </a>
        <a className="secondary" href="/demo/">
          Explorar demonstração <ArrowUpRight size={16} />
        </a>
      </header>
      <section className="portfolio-hero" id="conteudo">
        <div>
          <p className="eyebrow gold">FINANÇAS PESSOAIS · PROJETO DE PORTFÓLIO</p>
          <h1>
            Pequenos passos.
            <br />
            <em>Um reino de possibilidades.</em>
          </h1>
          <p className="portfolio-lead">
            Entenda seu dinheiro, planeje os próximos capítulos e transforme organização em
            progresso visível.
          </p>
          <div className="heading-actions">
            <a href="/demo/" className="primary">
              Conhecer o reino <ArrowUpRight size={18} />
            </a>
            <a href="#engenharia" className="text-button">
              Por dentro do projeto
            </a>
          </div>
          <p className="muted">Demonstração com dados fictícios. Sem cadastro.</p>
        </div>
        <figure>
          <img
            src="/kingdom.png"
            alt="Reino ilustrado entre florestas, com caminhos, casas e um castelo"
          />
          <figcaption>O reino cresce com hábitos de organização.</figcaption>
        </figure>
      </section>
      <section className="portfolio-features" aria-label="Recursos">
        <article className="panel">
          <CalendarDays className="gold" />
          <h2>Clareza para planejar</h2>
          <p>
            Faturas com fechamento automático, recorrências com prazo opcional e projeções
            explicáveis.
          </p>
        </article>
        <article className="panel">
          <Sparkles className="gold" />
          <h2>Progresso com propósito</h2>
          <p>
            Missões e conquistas valorizam cuidado e constância, sem premiar renda ou volume
            investido.
          </p>
        </article>
        <article className="panel">
          <ShieldCheck className="gold" />
          <h2>Dados sob seu controle</h2>
          <p>
            Valores em centavos, operações validadas e demonstração separada do ambiente pessoal.
          </p>
        </article>
      </section>
      <section id="engenharia" className="portfolio-engineering">
        <p className="eyebrow gold">DESIGN COM IDENTIDADE. ENGENHARIA COM EVIDÊNCIA.</p>
        <h2>
          Uma fantasia visual.
          <br />
          Regras financeiras concretas.
        </h2>
        <div>
          <p>
            React e TypeScript na interface. Domínio independente, validação Zod, serviço
            transacional e persistência D1 na aplicação privada. Testes verificam centavos,
            idempotência, preservação de registros e limites de datas.
          </p>
          <p>
            A demonstração permite navegar, filtrar períodos e simular metas. Edições são
            desativadas neste passeio. Não consulta contas reais nem conecta bancos. Cotações, Open
            Finance e IA externa são próximos passos, ainda não integrados.
          </p>
          <a className="secondary" href="/demo/">
            Abrir demonstração
          </a>
        </div>
      </section>
      <footer className="portfolio-footer">
        <span>
          <Crown size={18} /> Reino Financeiro
        </span>
        <p>Organização financeira com imaginação e responsabilidade.</p>
        <small>Projeto de portfólio · BRL · pt-BR</small>
      </footer>
    </main>
  );
}

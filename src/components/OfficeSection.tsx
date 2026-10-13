import React from 'react';
import { motion } from 'motion/react';
import { MapPin, Building2, Calendar, ArrowUpRight, Compass } from 'lucide-react';
import { getWhatsAppLink } from '../data/siteData';

interface OfficeSectionProps {
  onNavigate?: (path: string) => void;
  isStandaloneTab?: boolean;
}

export const OfficeSection: React.FC<OfficeSectionProps> = ({
  onNavigate,
  isStandaloneTab = false,
}) => {
  const googleMapsUrl =
    'https://www.google.com/maps/search/?api=1&query=Rua+Raul+Kennedy+Barra+da+Tijuca+Rio+de+Janeiro+RJ';

  const whatsappOfficeVisitUrl = getWhatsAppLink(
    'Olá! Gostaria de agendar uma reunião presencial no escritório da VULTO LAB na Barra da Tijuca (Rua Raul Kennedy).'
  );

  return (
    <section
      id="escritorio"
      aria-labelledby="office-heading"
      className={`bg-[#0A0A0A] border-b border-[#F4F4F1]/10 ${
        isStandaloneTab ? 'py-10 sm:py-14' : 'py-16 sm:py-24'
      } relative overflow-hidden`}
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* Cabeçalho Editorial da Seção */}
        <div className="max-w-3xl mb-10 sm:mb-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.22em] text-[#C6FF00] font-semibold">
              SEDE & OPERAÇÃO // BARRA DA TIJUCA, RJ
            </span>
          </div>

          <motion.h2
            id="office-heading"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-6xl leading-[0.98] tracking-[-0.035em] text-[#F4F4F1]"
          >
            ESTRUTURA FÍSICA.
            <br />
            <span className="text-[#C6FF00]">ONDE A ESTRATÉGIA ACONTECE.</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.08 }}
            className="mt-5 text-base sm:text-xl text-[#F4F4F1]/85 leading-relaxed font-light"
          >
            A <strong>VULTO LAB</strong> combina entrega de alta tecnologia com presença e operação real.
            Nossa sede física está localizada na <strong>Rua Raul Kennedy</strong>, na <strong>Barra da Tijuca, Rio de Janeiro (RJ)</strong> — um
            espaço privativo concebido para imersões de negócios, planejamento de ecossistemas digitais,
            estratégia de conversão e alinhamento executivo com nossos clientes.
          </motion.p>
        </div>

        {/* Foto Real do Escritório em Destaque */}
        <div className="mb-10 border border-[#F4F4F1]/15 bg-[#121212] overflow-hidden group relative">
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#0A0A0A]">
            <img
              src="/images/escritorio_real.jpg"
              alt="Escritório Real VULTO LAB na Rua Raul Kennedy, Barra da Tijuca, RJ"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-center group-hover:scale-[1.015] transition-transform duration-700 ease-out"
            />
            {/* Gradiente sutil para legibilidade técnica brutalista */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A]/85 via-[#0A0A0A]/20 to-transparent pointer-events-none" />

            {/* Badges Técnicos Sobrepostos */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 bg-[#0A0A0A]/90 backdrop-blur-md border border-[#C6FF00]/40 font-mono-tabular text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#C6FF00] font-semibold">
                SEDE OPERACIONAL · VULTO LAB
              </span>
              <span className="px-3 py-1.5 bg-[#0A0A0A]/90 backdrop-blur-md border border-[#F4F4F1]/15 font-mono-tabular text-[10px] sm:text-xs uppercase tracking-[0.16em] text-[#F4F4F1]/80">
                BARRA DA TIJUCA · RIO DE JANEIRO, RJ
              </span>
            </div>

            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs font-mono-tabular text-[#F4F4F1]">
              <div className="bg-[#0A0A0A]/85 backdrop-blur-md p-3 sm:p-4 border border-[#F4F4F1]/15 max-w-md">
                <span className="text-[#C6FF00] font-bold block mb-1">
                  AMBIENTE DE IMERSÃO E ESTRATÉGIA
                </span>
                <p className="text-[11px] sm:text-xs text-[#F4F4F1]/80 leading-snug">
                  Sala de reuniões executiva projetada para sessões estratégicas, briefings presenciais e demonstrações do ecossistema tecnológico da VULTO.
                </p>
              </div>

              <div className="hidden md:flex items-center gap-2 bg-[#0A0A0A]/85 backdrop-blur-md px-4 py-2 border border-[#F4F4F1]/15 text-[#F4F4F1]/70">
                <MapPin className="w-3.5 h-3.5 text-[#C6FF00]" />
                <span>RUA RAUL KENNEDY · BARRA DA TIJUCA, RJ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid Técnico: Endereço, Estrutura e Atendimento */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Endereço & Localização */}
          <div className="p-6 sm:p-8 border border-[#F4F4F1]/15 bg-[#121212] flex flex-col justify-between hover:border-[#C6FF00]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="p-2.5 bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30">
                  <MapPin className="w-5 h-5" />
                </span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/45 uppercase tracking-wider">
                  01 / LOCALIZAÇÃO
                </span>
              </div>

              <h3 className="font-display font-bold uppercase text-xl sm:text-2xl text-[#F4F4F1] mb-2 tracking-tight">
                BARRA DA TIJUCA
              </h3>

              <div className="space-y-1 font-mono-tabular text-xs sm:text-sm text-[#F4F4F1]/85 mb-4">
                <p className="font-bold text-[#C6FF00]">Rua Raul Kennedy</p>
                <p>Barra da Tijuca, Rio de Janeiro - RJ</p>
                <p className="text-[#F4F4F1]/55 text-xs">Ponto nobre na Zona Oeste do Rio de Janeiro</p>
              </div>

              <p className="text-xs sm:text-sm text-[#F4F4F1]/70 leading-relaxed font-light mb-6">
                Fácil acesso para clientes e parceiros de todo o estado, com estacionamento,
                segurança e privacidade corporativa.
              </p>
            </div>

            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full px-4 py-3 bg-[#F4F4F1]/5 hover:bg-[#F4F4F1]/10 border border-[#F4F4F1]/15 hover:border-[#C6FF00] text-[#F4F4F1] hover:text-[#C6FF00] font-mono-tabular text-xs font-semibold uppercase tracking-wider transition-all"
            >
              <span>VER NO GOOGLE MAPS</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2]" />
            </a>
          </div>

          {/* Card 2: Estrutura da Sala */}
          <div className="p-6 sm:p-8 border border-[#F4F4F1]/15 bg-[#121212] flex flex-col justify-between hover:border-[#C6FF00]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="p-2.5 bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/45 uppercase tracking-wider">
                  02 / INFRAESTRUTURA
                </span>
              </div>

              <h3 className="font-display font-bold uppercase text-xl sm:text-2xl text-[#F4F4F1] mb-2 tracking-tight">
                SALA DE REUNIÕES
              </h3>

              <ul className="space-y-2 text-xs sm:text-sm text-[#F4F4F1]/80 mb-6 font-mono-tabular">
                <li className="flex items-start gap-2">
                  <span className="text-[#C6FF00] mt-0.5">✓</span>
                  <span>Mesa executiva ampla para até 8 pessoas</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C6FF00] mt-0.5">✓</span>
                  <span>Pontos de energia e rede embutidos</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C6FF00] mt-0.5">✓</span>
                  <span>Privacidade acústica e iluminação difusa</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#C6FF00] mt-0.5">✓</span>
                  <span>Ambiente climatizado e tecnológico</span>
                </li>
              </ul>
            </div>

            <div className="p-3 bg-[#0A0A0A] border border-[#F4F4F1]/10 font-mono-tabular text-[11px] text-[#F4F4F1]/60 flex items-center justify-between">
              <span>ESTRUTURA PRIVATIVA</span>
              <span className="text-[#C6FF00] font-bold">100% OPERACIONAL</span>
            </div>
          </div>

          {/* Card 3: Atendimento Presencial com Agendamento */}
          <div className="p-6 sm:p-8 border border-[#F4F4F1]/15 bg-[#121212] flex flex-col justify-between hover:border-[#C6FF00]/50 transition-colors">
            <div>
              <div className="flex items-center justify-between mb-5">
                <span className="p-2.5 bg-[#C6FF00]/10 text-[#C6FF00] border border-[#C6FF00]/30">
                  <Calendar className="w-5 h-5" />
                </span>
                <span className="font-mono-tabular text-xs text-[#F4F4F1]/45 uppercase tracking-wider">
                  03 / ATENDIMENTO
                </span>
              </div>

              <h3 className="font-display font-bold uppercase text-xl sm:text-2xl text-[#F4F4F1] mb-2 tracking-tight">
                REUNIÕES PRESENCIAIS
              </h3>

              <p className="text-xs sm:text-sm text-[#F4F4F1]/75 leading-relaxed font-light mb-4">
                Recebemos clientes e parceiros exclusivamente com <strong>hora marcada</strong>,
                garantindo dedicação total da equipe técnica ao alinhamento estratégico do seu projeto.
              </p>

              <div className="space-y-1 font-mono-tabular text-xs text-[#F4F4F1]/65 mb-6">
                <p>• Apresentação de estratégias de mídia</p>
                <p>• Briefings de novos sites e ecossistemas</p>
                <p>• Demonstrações do VULTO TAP NFC</p>
              </div>
            </div>

            <a
              href={whatsappOfficeVisitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full px-4 py-3 bg-[#C6FF00] hover:bg-[#d4ff33] text-[#0A0A0A] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <span>AGENDAR UMA REUNIÃO</span>
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </a>
          </div>
        </div>

        {/* Faixa de Rodapé da Seção com Endereço e Botão de Contato */}
        <div className="p-5 sm:p-7 border border-[#F4F4F1]/15 bg-[#121212] flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <span className="p-2.5 bg-[#C6FF00]/10 text-[#C6FF00] shrink-0 border border-[#C6FF00]/30">
              <Compass className="w-5 h-5" />
            </span>
            <div>
              <span className="font-mono-tabular text-xs uppercase tracking-[0.16em] text-[#C6FF00] font-semibold block">
                VENHA CONVERSAR CONOSCO NO RIO DE JANEIRO
              </span>
              <p className="text-sm sm:text-base text-[#F4F4F1] font-medium mt-0.5">
                Rua Raul Kennedy, Barra da Tijuca — Rio de Janeiro, RJ
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 border border-[#F4F4F1]/20 hover:border-[#C6FF00] text-[#F4F4F1] hover:text-[#C6FF00] font-mono-tabular text-xs uppercase tracking-wider transition-colors w-full sm:w-auto"
            >
              <span>COMO CHEGAR (MAPS)</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>

            {onNavigate && (
              <a
                href="/contato"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigate('/contato');
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs uppercase tracking-wider hover:bg-[#d4ff33] transition-colors w-full sm:w-auto"
              >
                <span>FALAR COM A VULTO</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

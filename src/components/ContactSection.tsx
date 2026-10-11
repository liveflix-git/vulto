import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { ArrowUpRight, Check, AlertCircle, RotateCcw, Mail, Copy } from 'lucide-react';
import { BRAND_CONFIG, DirectTeamContact } from '../data/siteData';
import { useLanguage } from '../context/LanguageContext';

const CONTACT_EMAILS: Record<string, string> = {
  felipe: 'felipe@vultolab.company',
  pietro: 'pietro@vultolab.company',
};

export interface ContactFormPayload {
  nome: string;
  empresa: string;
  whatsapp: string;
  email: string;
  servico: string;
  mensagem: string;
  submittedAt: string;
}

interface ContactSectionProps {
  initialService?: string;
  isFullPage?: boolean;
}

const WhatsappIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.012 2C6.486 2 2 6.479 2 12.006c0 1.898.531 3.67 1.453 5.187L2 22l4.938-1.428a9.96 9.96 0 0 0 5.074 1.434h.005c5.524 0 10.012-4.479 10.012-10.006A9.99 9.99 0 0 0 12.012 2zm0 18.328h-.004a8.31 8.31 0 0 1-4.232-1.16l-.304-.18-3.141.908.925-3.064-.198-.315a8.293 8.293 0 0 1-1.272-4.435c0-4.587 3.731-8.318 8.326-8.318 2.223 0 4.312.866 5.885 2.44 1.572 1.574 2.437 3.663 2.436 5.886 0 4.588-3.73 8.238-8.321 8.238zm4.561-6.19c-.25-.125-1.478-.729-1.708-.812-.23-.083-.397-.125-.564.125-.167.25-.647.812-.793.979-.146.167-.292.188-.542.063-.25-.125-1.056-.389-2.011-1.24-.743-.663-1.245-1.482-1.391-1.732-.146-.25-.016-.385.109-.509.113-.112.25-.292.375-.438.125-.146.167-.25.25-.417.083-.167.042-.313-.021-.438-.063-.125-.564-1.356-.772-1.856-.203-.487-.41-.421-.564-.429l-.481-.008c-.167 0-.438.063-.667.313s-.875.854-.875 2.083c0 1.229.896 2.417 1.021 2.583.125.167 1.763 2.693 4.272 3.777.597.258 1.063.412 1.427.528.6.19 1.146.163 1.577.099.48-.071 1.478-.604 1.687-1.188.208-.583.208-1.083.146-1.188-.063-.104-.229-.167-.479-.292z" />
  </svg>
);

export const ContactSection: React.FC<ContactSectionProps> = ({
  initialService = '',
  isFullPage = false,
}) => {
  const { dict, directContacts } = useLanguage();
  const cs = dict.contactSection;

  const [nome, setNome] = useState('');
  const [empresa, setEmpresa] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [servico, setServico] = useState(initialService || cs.serviceOptions[0]);
  const [mensagem, setMensagem] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyEmail = async (emailText: string, contactId: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(emailText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = emailText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedId(contactId);
      setTimeout(() => {
        setCopiedId((prev) => (prev === contactId ? null : prev));
      }, 2000);
    } catch {
      try {
        const textarea = document.createElement('textarea');
        textarea.value = emailText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopiedId(contactId);
        setTimeout(() => {
          setCopiedId((prev) => (prev === contactId ? null : prev));
        }, 2000);
      } catch {
        // Fallback silencioso sem alert
      }
    }
  };

  useEffect(() => {
    if (initialService && cs.serviceOptions.includes(initialService)) {
      setServico(initialService);
    }
  }, [initialService, cs.serviceOptions]);

  const validateForm = (): boolean => {
    const nextErrors: Record<string, string> = {};

    if (!nome.trim() || nome.trim().length < 2) {
      nextErrors.nome = cs.errors.name;
    }

    if (!empresa.trim()) {
      nextErrors.empresa = cs.errors.company;
    }

    const digitsOnly = whatsapp.replace(/\D/g, '');
    if (!digitsOnly || digitsOnly.length < 9) {
      nextErrors.whatsapp = cs.errors.whatsapp;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      nextErrors.email = cs.errors.email;
    }

    if (!servico) {
      nextErrors.servico = cs.errors.service;
    }

    if (!mensagem.trim() || mensagem.trim().length < 10) {
      nextErrors.mensagem = cs.errors.message;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: '5ac80784-f33b-4cfe-bc7a-feb5ae8e93bc',
          subject: 'Novo contato pelo site da VULTO LAB',
          from_name: 'VULTO LAB',
          name: nome.trim(),
          company: empresa.trim(),
          whatsapp: whatsapp.trim(),
          email: email.trim(),
          service: servico,
          message: mensagem.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSubmitted(true);
      } else {
        setSubmitError(data.message || cs.errors.genericSubmit);
      }
    } catch {
      setSubmitError(cs.errors.connectionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNome('');
    setEmpresa('');
    setWhatsapp('');
    setEmail('');
    setMensagem('');
    setErrors({});
    setSubmitError('');
    setSubmitted(false);
  };

  return (
    <section
      id="contato"
      aria-labelledby="contact-heading"
      className={`bg-[#0A0A0A] border-b border-[#F4F4F1]/10 ${
        isFullPage ? 'pt-32 pb-24 sm:pt-40 sm:pb-32' : 'py-20 sm:py-28 lg:py-36'
      }`}
    >
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
        {/* 1. HERO / CONTATO */}
        <div className="max-w-3xl mb-12 sm:mb-16">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-5 h-[1.5px] bg-[#C6FF00]" />
            <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#F4F4F1]/60 font-semibold">
              {cs.kicker}
            </span>
          </div>

          <motion.h1
            id="contact-heading"
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.45 }}
            className="font-display font-bold uppercase text-3xl sm:text-5xl lg:text-[3.5rem] leading-[0.98] tracking-[-0.035em] text-[#F4F4F1]"
          >
            {cs.headingLine1}
            <span className="block mt-2 text-[#C6FF00]">{cs.headingLine2}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mt-5 text-base sm:text-xl text-[#F4F4F1]/85 leading-relaxed max-w-2xl font-light"
          >
            {cs.subtitle}
          </motion.p>
        </div>

        {/* 2. CARDS DE ATENDIMENTO DIRETO (FELIPE & PIETRO) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-8">
          {directContacts.map((contact) => {
            const emailAddress =
              CONTACT_EMAILS[contact.id] ||
              (contact.id.toLowerCase().includes('pietro')
                ? 'pietro@vultolab.company'
                : 'felipe@vultolab.company');
            const isCopied = copiedId === contact.id;
            const isPietro = contact.id.toLowerCase().includes('pietro');
            const desktopWhatsAppText = isPietro
              ? 'FALAR COM PIETRO NO WHATSAPP'
              : 'FALAR COM FELIPE NO WHATSAPP';
            const mobileWhatsAppText = isPietro
              ? 'WHATSAPP PIETRO'
              : 'WHATSAPP FELIPE';

            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="border border-[#F4F4F1]/15 bg-[#121212] p-6 sm:p-8 flex flex-col justify-between hover:border-[#C6FF00] transition-colors duration-200 group relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 pb-4 mb-6 border-b border-[#F4F4F1]/10">
                    <div className="flex items-center gap-2.5">
                      <span className="p-1.5 bg-[#C6FF00]/10 text-[#C6FF00]">
                        <WhatsappIcon className="w-4 h-4" />
                      </span>
                      <span className="font-mono-tabular text-xs font-semibold uppercase tracking-[0.12em] text-[#C6FF00]">
                        WHATSAPP
                      </span>
                    </div>
                    <span className="font-mono-tabular text-xs font-medium text-[#F4F4F1]/60">
                      {contact.phoneFormatted}
                    </span>
                  </div>

                  <h3 className="font-display font-bold text-2xl sm:text-3xl uppercase tracking-[-0.02em] text-[#F4F4F1] mb-3">
                    {contact.cardTitle}
                  </h3>

                  <p className="text-sm sm:text-base text-[#F4F4F1]/80 leading-relaxed mb-6 font-light">
                    {contact.desc}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Botão principal de WhatsApp */}
                  <a
                    href={contact.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-cursor="cta"
                    className="inline-flex items-center justify-between w-full px-5 sm:px-6 py-4 bg-[#C6FF00] text-[#0A0A0A] font-bold text-xs sm:text-sm uppercase tracking-[0.08em] sm:tracking-[0.1em] hover:bg-[#d4ff33] transition-colors group/btn cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <WhatsappIcon className="w-4 h-4 shrink-0 text-[#0A0A0A]" />
                      <span className="hidden sm:inline truncate">{desktopWhatsAppText}</span>
                      <span className="sm:hidden truncate">{mobileWhatsAppText}</span>
                    </div>
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5] shrink-0 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform ml-2" />
                  </a>

                  {/* Bloco secundário de contato por E-mail */}
                  <div className="border border-[#F4F4F1]/12 bg-[#0A0A0A]/70 p-4 transition-colors">
                    <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-[#F4F4F1]/8">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-[#F4F4F1]/60" />
                        <span className="font-mono-tabular text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#F4F4F1]/60">
                          E-MAIL
                        </span>
                      </div>
                      <span className="font-mono-tabular text-[10px] uppercase tracking-[0.12em] text-[#F4F4F1]/40">
                        DIRETO
                      </span>
                    </div>

                    <p className="font-mono-tabular text-xs sm:text-sm text-[#F4F4F1] font-medium tracking-tight mb-3 break-all select-all">
                      {emailAddress}
                    </p>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Ação 1: Enviar E-mail */}
                      <a
                        href={`mailto:${emailAddress}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#F4F4F1]/5 hover:bg-[#F4F4F1]/10 text-[#F4F4F1]/85 hover:text-[#F4F4F1] border border-[#F4F4F1]/15 hover:border-[#F4F4F1]/30 text-[11px] font-mono-tabular font-semibold uppercase tracking-[0.08em] transition-all cursor-pointer"
                      >
                        <Mail className="w-3 h-3 text-[#F4F4F1]/70" />
                        <span>ENVIAR E-MAIL</span>
                      </a>

                      {/* Ação 2: Copiar E-mail */}
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(emailAddress, contact.id)}
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 border text-[11px] font-mono-tabular font-semibold uppercase tracking-[0.08em] transition-all cursor-pointer ${
                          isCopied
                            ? 'bg-[#C6FF00]/15 text-[#C6FF00] border-[#C6FF00]/60'
                            : 'bg-[#F4F4F1]/5 hover:bg-[#F4F4F1]/10 text-[#F4F4F1]/85 hover:text-[#F4F4F1] border-[#F4F4F1]/15 hover:border-[#F4F4F1]/30'
                        }`}
                        title="Copiar e-mail para a área de transferência"
                        aria-label={`Copiar e-mail de ${contact.name}`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3 h-3 text-[#C6FF00]" />
                            <span className="text-[#C6FF00]">COPIADO!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-[#F4F4F1]/70" />
                            <span>COPIAR</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* 3. TEXTO DE APOIO */}
        <div className="pt-2 pb-12 border-b border-[#F4F4F1]/12 mb-12 sm:mb-16">
          <p className="font-mono-tabular text-xs sm:text-sm uppercase tracking-[0.2em] text-[#C6FF00] font-bold mb-1.5">
            {cs.directSupportTitle}
          </p>
          <p className="text-sm sm:text-base text-[#F4F4F1]/70 leading-relaxed">
            {cs.directSupportSubtitle}
          </p>
        </div>

        {/* 4. FORMULÁRIO E OUTROS CANAIS */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-8">
            <div className="border border-[#F4F4F1]/12 bg-[#121212]/60 p-6 sm:p-10 lg:p-12">
              <div className="mb-8 pb-6 border-b border-[#F4F4F1]/10">
                <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00] font-semibold block mb-2">
                  {cs.formKicker}
                </span>
                <h2 className="font-display font-bold uppercase text-2xl sm:text-3xl text-[#F4F4F1]">
                  {cs.formTitle}
                </h2>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-12 sm:py-16 space-y-6"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-12 h-12 bg-[#C6FF00] text-[#0A0A0A] flex items-center justify-center">
                    <Check className="w-6 h-6 stroke-[2.5]" />
                  </div>

                  <div className="space-y-2">
                    <span className="font-mono-tabular text-xs uppercase tracking-[0.2em] text-[#C6FF00]">
                      {cs.successBadge}
                    </span>
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#F4F4F1] tracking-tight whitespace-pre-line">
                      {cs.successTitle}
                    </h3>
                  </div>

                  <p className="text-sm text-[#F4F4F1]/70 max-w-md leading-relaxed">
                    {cs.successSummary} <strong className="text-[#F4F4F1]">{nome}</strong> (
                    {empresa}) - <strong className="text-[#C6FF00]">{servico}</strong>.
                  </p>

                  <div className="pt-4 flex flex-wrap items-center gap-4 border-t border-[#F4F4F1]/10">
                    <button
                      type="button"
                      onClick={handleReset}
                      className="inline-flex items-center gap-2 px-5 py-3 bg-[#C6FF00] text-[#0A0A0A] text-xs font-bold uppercase tracking-wider hover:bg-[#d4ff33] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{cs.newSubmissionButton}</span>
                    </button>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact-nome"
                        className="block font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/70 mb-2"
                      >
                        {cs.nameLabel} <span className="text-[#C6FF00]">*</span>
                      </label>
                      <input
                        id="contact-nome"
                        type="text"
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value);
                          if (errors.nome) setErrors({ ...errors, nome: '' });
                        }}
                        placeholder={cs.namePlaceholder}
                        className={`w-full bg-[#0A0A0A] border px-4 py-3.5 text-sm text-[#F4F4F1] placeholder:text-[#F4F4F1]/30 focus:outline-none transition-colors ${
                          errors.nome
                            ? 'border-red-400'
                            : 'border-[#F4F4F1]/15 focus:border-[#C6FF00]'
                        }`}
                      />
                      {errors.nome && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.nome}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-empresa"
                        className="block font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/70 mb-2"
                      >
                        {cs.companyLabel} <span className="text-[#C6FF00]">*</span>
                      </label>
                      <input
                        id="contact-empresa"
                        type="text"
                        value={empresa}
                        onChange={(e) => {
                          setEmpresa(e.target.value);
                          if (errors.empresa) setErrors({ ...errors, empresa: '' });
                        }}
                        placeholder={cs.companyPlaceholder}
                        className={`w-full bg-[#0A0A0A] border px-4 py-3.5 text-sm text-[#F4F4F1] placeholder:text-[#F4F4F1]/30 focus:outline-none transition-colors ${
                          errors.empresa
                            ? 'border-red-400'
                            : 'border-[#F4F4F1]/15 focus:border-[#C6FF00]'
                        }`}
                      />
                      {errors.empresa && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.empresa}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="contact-whatsapp"
                        className="block font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/70 mb-2"
                      >
                        {cs.whatsappLabel} <span className="text-[#C6FF00]">*</span>
                      </label>
                      <input
                        id="contact-whatsapp"
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => {
                          setWhatsapp(e.target.value);
                          if (errors.whatsapp) setErrors({ ...errors, whatsapp: '' });
                        }}
                        placeholder={cs.whatsappPlaceholder}
                        className={`w-full bg-[#0A0A0A] border px-4 py-3.5 text-sm text-[#F4F4F1] placeholder:text-[#F4F4F1]/30 focus:outline-none transition-colors ${
                          errors.whatsapp
                            ? 'border-red-400'
                            : 'border-[#F4F4F1]/15 focus:border-[#C6FF00]'
                        }`}
                      />
                      {errors.whatsapp && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.whatsapp}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="block font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/70 mb-2"
                      >
                        {cs.emailLabel} <span className="text-[#C6FF00]">*</span>
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        placeholder={cs.emailPlaceholder}
                        className={`w-full bg-[#0A0A0A] border px-4 py-3.5 text-sm text-[#F4F4F1] placeholder:text-[#F4F4F1]/30 focus:outline-none transition-colors ${
                          errors.email
                            ? 'border-red-400'
                            : 'border-[#F4F4F1]/15 focus:border-[#C6FF00]'
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/70 mb-3">
                      {cs.serviceLabel} <span className="text-[#C6FF00]">*</span>
                    </label>
                    <div
                      role="radiogroup"
                      aria-label={cs.serviceLabel}
                      className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5"
                    >
                      {cs.serviceOptions.map((option) => {
                        const active = servico === option;
                        return (
                          <button
                            key={option}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => setServico(option)}
                            className={`min-h-[48px] sm:min-h-[42px] px-2.5 sm:px-3.5 py-2 text-[10px] sm:text-xs font-mono-tabular uppercase tracking-wider border text-left flex items-center justify-between transition-colors cursor-pointer leading-tight ${
                              active
                                ? 'border-[#C6FF00] bg-[#C6FF00]/10 text-[#F4F4F1] font-semibold'
                                : 'border-[#F4F4F1]/15 bg-[#0A0A0A] text-[#F4F4F1]/65 hover:border-[#F4F4F1]/40'
                            }`}
                          >
                            <span className="break-words min-w-0 pr-1">{option}</span>
                            <span
                              className={`w-1.5 h-1.5 shrink-0 ml-1 ${
                                active ? 'bg-[#C6FF00]' : 'bg-transparent'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="contact-mensagem"
                      className="block font-mono-tabular text-xs uppercase tracking-[0.14em] text-[#F4F4F1]/70 mb-2"
                    >
                      {cs.messageLabel} <span className="text-[#C6FF00]">*</span>
                    </label>
                    <textarea
                      id="contact-mensagem"
                      rows={4}
                      value={mensagem}
                      onChange={(e) => {
                        setMensagem(e.target.value);
                        if (errors.mensagem) setErrors({ ...errors, mensagem: '' });
                      }}
                      placeholder={cs.messagePlaceholder}
                      className={`w-full bg-[#0A0A0A] border px-4 py-3.5 text-sm text-[#F4F4F1] placeholder:text-[#F4F4F1]/30 focus:outline-none transition-colors resize-y ${
                        errors.mensagem
                          ? 'border-red-400'
                          : 'border-[#F4F4F1]/15 focus:border-[#C6FF00]'
                      }`}
                    />
                    {errors.mensagem && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.mensagem}</span>
                      </p>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-3.5 bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      data-cursor="cta"
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#C6FF00] text-[#0A0A0A] text-xs sm:text-sm font-bold uppercase tracking-[0.1em] hover:bg-[#d4ff33] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      <span>
                        {isSubmitting ? cs.submittingButton : cs.submitButton}
                      </span>
                      <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* OUTROS CANAIS */}
          <div className="lg:col-span-4 space-y-8">
            <div className="border border-[#F4F4F1]/12 bg-[#121212]/40 p-6 sm:p-8 space-y-6">
              <div>
                <span className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#F4F4F1]/45 block mb-2">
                  {cs.emailCommercialTitle}
                </span>
                <a
                  href={`mailto:${BRAND_CONFIG.email}`}
                  className="font-mono-tabular text-sm text-[#F4F4F1] hover:text-[#C6FF00] transition-colors font-semibold block"
                >
                  {BRAND_CONFIG.email}
                </a>
              </div>

              <div className="pt-4 border-t border-[#F4F4F1]/10 space-y-3">
                <span className="font-mono-tabular text-[11px] uppercase tracking-[0.2em] text-[#F4F4F1]/45 block">
                  {cs.officialNetworksTitle}
                </span>
                <div className="flex flex-col gap-2 font-mono-tabular text-xs uppercase tracking-wider text-[#F4F4F1]/80">
                  <a
                    href={BRAND_CONFIG.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-between hover:text-[#C6FF00] transition-colors py-1"
                  >
                    <span>Instagram (@vulto.lab)</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F4F4F1]/10">
                <span className="font-mono-tabular text-[10px] uppercase tracking-[0.16em] text-[#F4F4F1]/40 block">
                  {cs.internationalPresenceTitle}
                </span>
                <p className="text-xs text-[#F4F4F1]/70 mt-1 font-mono-tabular">
                  {cs.marketsText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

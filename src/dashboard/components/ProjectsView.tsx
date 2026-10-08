import React from 'react';
import {
  Kanban,
  CheckSquare,
  Square,
  Clock,
  Plus,
  ArrowUpRight,
  User,
  CheckCircle2,
} from 'lucide-react';
import { ProjectRecord, PartnerId } from '../types';

interface ProjectsViewProps {
  projects: ProjectRecord[];
  onToggleTask: (projectId: string, taskId: string) => void;
  onOpenNewRecord: () => void;
  currentUser: PartnerId;
}

export function ProjectsView({
  projects,
  onToggleTask,
  onOpenNewRecord,
}: ProjectsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#111111] border border-white/10 p-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono tracking-widest text-[#C6FF00] uppercase">
              // OPERAÇÃO & SPRINT DELIVERY
            </span>
            <span className="text-white/20">•</span>
            <span className="text-[10px] font-mono text-white/50">
              EXECUÇÃO TÉCNICA E PRAZOS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            Projetos, Entregáveis & Cronogramas
          </h1>
          <p className="text-xs text-white/60 font-sans mt-0.5">
            Acompanhe o status de cada entrega técnica, sprints em produção e responsabilidades.
          </p>
        </div>

        <button
          onClick={onOpenNewRecord}
          className="px-4 py-2.5 bg-[#C6FF00] hover:bg-[#b0e600] text-[#0A0A0A] font-mono font-bold text-xs tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>NOVO PROJETO</span>
        </button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {projects.map((proj) => {
          const completedTasks = proj.tasks.filter((t) => t.completed).length;
          const totalTasks = proj.tasks.length;
          const calcPercent =
            totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

          return (
            <div
              key={proj.id}
              className="bg-[#111111] border border-white/10 p-5 flex flex-col justify-between"
            >
              <div>
                {/* Meta top */}
                <div className="flex items-center justify-between text-[10px] font-mono text-white/40 mb-2">
                  <span className="text-[#C6FF00] font-bold uppercase">
                    {proj.serviceType}
                  </span>
                  <span className="flex items-center gap-1 text-white/50">
                    <Clock className="w-3 h-3" /> Prazo: {proj.deadline}
                  </span>
                </div>

                <h3 className="font-mono text-base font-bold text-white mb-1">
                  {proj.title}
                </h3>
                <p className="text-xs text-white/60 font-sans mb-3">
                  Cliente: <strong className="text-white">{proj.clientName}</strong> • Líder: <span className="uppercase font-mono text-white/80">{proj.leadPartner}</span>
                </p>

                {/* Progress Bar */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-[11px] font-mono text-white/60">
                    <span>Progresso da Sprint</span>
                    <span className="text-[#C6FF00] font-bold">{calcPercent}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#181818] overflow-hidden">
                    <div
                      style={{ width: `${calcPercent}%` }}
                      className="h-full bg-[#C6FF00] transition-all duration-300"
                    />
                  </div>
                </div>

                {/* Task Checklist */}
                <div className="space-y-2">
                  <div className="text-[10px] font-mono text-white/40 uppercase">
                    Etapas de Entrega ({completedTasks}/{totalTasks}):
                  </div>
                  <div className="space-y-1.5">
                    {proj.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => onToggleTask(proj.id, task.id)}
                        className="w-full flex items-start gap-2.5 p-2 bg-[#161616] hover:bg-[#1C1C1C] text-left border border-white/5 transition-colors cursor-pointer group"
                      >
                        {task.completed ? (
                          <CheckSquare className="w-4 h-4 text-[#C6FF00] shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-white/30 group-hover:text-white/60 shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-xs font-mono leading-snug ${
                            task.completed
                              ? 'line-through text-white/40'
                              : 'text-white/80'
                          }`}
                        >
                          {task.title}
                        </span>
                        <span className="text-[9px] font-mono text-white/30 ml-auto uppercase shrink-0">
                          {task.assignedTo}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer Links */}
              {proj.deliverableLink && (
                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <a
                    href={proj.deliverableLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono text-[#C6FF00] hover:underline flex items-center gap-1.5"
                  >
                    <span>Ambiente de Homologação</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Online
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

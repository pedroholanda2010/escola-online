"use client";

import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";

type Student = {
  id: string;
  name: string;
  email: string;
  classroom: string;
};

type Discipline = {
  id: string;
  name: string;
  teacher: string;
  color: string;
};

type Grade = {
  studentId: string;
  disciplineId: string;
  value: number | null;
};

type SchoolData = {
  students: Student[];
  disciplines: Discipline[];
  grades: Grade[];
  teamName: string;
  teamMembers: string[];
};

type UserSession = {
  role: "admin" | "student";
  studentId?: string;
};

type Section = "overview" | "students" | "disciplines" | "grades" | "team" | "how";
type ModalState =
  | { type: "student" | "discipline" | "grade"; mode: "create" | "edit"; id?: string }
  | null;

const DATA_KEY = "escola-online:data:v1";
const SESSION_KEY = "escola-online:session:v1";
const DEMO_GRADES_SEEDED_KEY = "escola-online:demo-grades-seeded:v1";
const starterTeamMembers = ["Antônia Heloísa", "Aline Azevedo", "Pedro Henrique"];

// Troque os caminhos das fotos e os links abaixo pelos dados reais de cada integrante.
const teamProfiles = [
  {
    photo: "/images/equipe/antonia.jpeg",
    github: "https://github.com/antoniahbsilva",
    githubLabel: "GitHub de Antônia",
  },
  {
    photo: "/images/equipe/aline.jpeg",
    github: "https://github.com/Alineazevedo5",
    githubLabel: "GitHub de Aline",
  },
  {
    photo: "/images/equipe/pedro.jpeg",
    github: "https://github.com/pedroholanda2010",
    githubLabel: "GitHub de Pedro",
  },
];

// Cole aqui o link do vídeo do YouTube quando ele for enviado.
const YOUTUBE_VIDEO_URL = "";

function getYoutubeEmbedUrl(url: string) {
  if (!url.trim()) return "";
  try {
    const parsed = new URL(url);
    let videoId = "";
    if (parsed.hostname.includes("youtu.be")) videoId = parsed.pathname.slice(1);
    else if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v") || parsed.pathname.split("/embed/")[1]?.split("/")[0] || "";
    }
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch {
    return "";
  }
}

const starterStudents: Student[] = [
  { id: "2025001", name: "Ana Clara Martins", email: "ana.martins@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025002", name: "Bruno Henrique Costa", email: "bruno.costa@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025003", name: "Camila Rodrigues Lima", email: "camila.lima@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025004", name: "Daniel Oliveira Santos", email: "daniel.santos@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025005", name: "Eduarda Alves Ferreira", email: "eduarda.ferreira@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025006", name: "Felipe Souza Ribeiro", email: "felipe.ribeiro@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025007", name: "Giovana Pereira Mendes", email: "giovana.mendes@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025008", name: "Heitor Carvalho Gomes", email: "heitor.gomes@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025009", name: "Isabela Nunes Barros", email: "isabela.barros@aluno.edu.br", classroom: "2º DS B" },
  { id: "2025010", name: "João Pedro Almeida", email: "joao.almeida@aluno.edu.br", classroom: "2º DS B" },
];

const starterDisciplines: Discipline[] = [
  { id: "d1", name: "Programação Web I", teacher: "Prof.ª Mariana", color: "mint" },
  { id: "d2", name: "Banco de Dados", teacher: "Prof. Ricardo", color: "lavender" },
  { id: "d3", name: "Análise de Sistemas", teacher: "Prof.ª Camila", color: "peach" },
  { id: "d4", name: "Empreendedorismo", teacher: "Prof. André", color: "blue" },
  { id: "d5", name: "Português", teacher: "A definir", color: "mint" },
  { id: "d6", name: "Matemática", teacher: "A definir", color: "lavender" },
  { id: "d7", name: "História", teacher: "A definir", color: "peach" },
  { id: "d8", name: "Geografia", teacher: "A definir", color: "blue" },
  { id: "d9", name: "Biologia", teacher: "A definir", color: "mint" },
  { id: "d10", name: "Física", teacher: "A definir", color: "lavender" },
  { id: "d11", name: "Química", teacher: "A definir", color: "peach" },
  { id: "d12", name: "Língua Inglesa", teacher: "A definir", color: "blue" },
  { id: "d13", name: "Educação Física", teacher: "A definir", color: "mint" },
  { id: "d14", name: "Filosofia", teacher: "A definir", color: "lavender" },
  { id: "d15", name: "Sociologia", teacher: "A definir", color: "peach" },
  { id: "d16", name: "Artes", teacher: "A definir", color: "blue" },
  { id: "d17", name: "Literatura", teacher: "A definir", color: "mint" },
  { id: "d18", name: "Espanhol", teacher: "A definir", color: "lavender" },
  { id: "d19", name: "Projeto de Vida", teacher: "A definir", color: "peach" },
  { id: "d20", name: "Educação Financeira", teacher: "A definir", color: "blue" },
];

function disciplineKey(name: string) {
  const normalized = name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
  return normalized === "lingua portuguesa" ? "portugues" : normalized;
}

const emptyGrades = (students: Student[], disciplines: Discipline[]): Grade[] =>
  students.flatMap((student) =>
    disciplines.map((discipline) => ({
      studentId: student.id,
      disciplineId: discipline.id,
      value: null,
    })),
  );

function demoGrade(studentId: string, disciplineId: string) {
  const key = `${studentId}:${disciplineId}`;
  let hash = 0;
  for (const character of key) {
    hash = (hash * 31 + character.charCodeAt(0)) % 61;
  }
  return (40 + hash) / 10;
}

const starterGrades = emptyGrades(starterStudents, starterDisciplines).map((grade) => ({
  ...grade,
  value: demoGrade(grade.studentId, grade.disciplineId),
}));

const initialData: SchoolData = {
  students: starterStudents,
  disciplines: starterDisciplines,
  grades: starterGrades,
  teamName: "Equipe 2DS",
  teamMembers: starterTeamMembers,
};

function Icon({
  name,
  size = 20,
}: {
  name: string;
  size?: number;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 1 4 17.5z" /><path d="M4 17.5A2.5 2.5 0 0 1 6.5 15H20M8 7h8M8 10h6" /></>,
    chart: <><path d="M4 19.5h16M6.5 16V10m5 6V5m5 11v-4" /><circle cx="6.5" cy="8" r="1" /><circle cx="11.5" cy="3" r="1" /><circle cx="16.5" cy="10" r="1" /></>,
    team: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1M16 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v1" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    edit: <><path d="m15 5 4 4M4 20l4-.8L19 8a2.1 2.1 0 0 0-3-3L5 16z" /></>,
    trash: <><path d="M4 7h16M10 11v6M14 11v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    check: <><path d="m5 12 4 4L19 6" /></>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    cap: <><path d="m2 10 10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5M22 10v6" /></>,
    arrow: <><path d="M5 12h14M13 6l6 6-6 6" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
    play: <><path d="m8 5 11 7-11 7z" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      {...common}
    >
      {paths[name] ?? paths.grid}
    </svg>
  );
}

function getStatus(value: number | null) {
  if (value === null) return { label: "Sem nota", tone: "neutral" };
  if (value < 5) return { label: "Reprovado", tone: "danger" };
  if (value < 6) return { label: "Em avaliação", tone: "warning" };
  if (value < 7) return { label: "Recuperação", tone: "warning" };
  return { label: "Aprovado", tone: "success" };
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatGrade(value: number | null) {
  return value === null ? "—" : value.toFixed(1).replace(".", ",");
}

function average(values: (number | null)[]) {
  const recorded = values.filter((value): value is number => value !== null);
  if (!recorded.length) return null;
  return recorded.reduce((total, value) => total + value, 0) / recorded.length;
}

function StatusBadge({ value }: { value: number | null }) {
  const status = getStatus(value);
  return <span className={`status-badge ${status.tone}`}>{status.label}</span>;
}

export default function Home() {
  const [data, setData] = useState<SchoolData>(initialData);
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [modal, setModal] = useState<ModalState>(null);
  const [query, setQuery] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        let currentData = initialData;
        const shouldSeedDemoGrades = window.localStorage.getItem(DEMO_GRADES_SEEDED_KEY) !== "true";
        const saved = window.localStorage.getItem(DATA_KEY);
        if (saved) {
          const parsed: unknown = JSON.parse(saved);
          if (
            typeof parsed === "object" &&
            parsed !== null &&
            "students" in parsed &&
            Array.isArray(parsed.students) &&
            "disciplines" in parsed &&
            Array.isArray(parsed.disciplines) &&
            "grades" in parsed &&
            Array.isArray(parsed.grades)
          ) {
            const disciplines = [...(parsed.disciplines as Discipline[])];
            for (const starterDiscipline of starterDisciplines) {
              if (disciplines.some((saved) => disciplineKey(saved.name) === disciplineKey(starterDiscipline.name))) {
                continue;
              }

              let id = starterDiscipline.id;
              let suffix = 2;
              while (disciplines.some((saved) => saved.id === id)) {
                id = `${starterDiscipline.id}-${suffix}`;
                suffix += 1;
              }
              disciplines.push({ ...starterDiscipline, id });
            }
            const students = (parsed.students as Student[]).map((student) => ({
              ...student,
              classroom: student.classroom.replace("2º DS A", "2º DS B"),
            }));
            const grades = (parsed.grades as Grade[]).map((grade) => ({
              ...grade,
              value: shouldSeedDemoGrades && grade.value === null
                ? demoGrade(grade.studentId, grade.disciplineId)
                : grade.value,
            }));
            const missingGrades = students.flatMap((student) =>
              disciplines
                .filter((discipline) => !grades.some((grade) => grade.studentId === student.id && grade.disciplineId === discipline.id))
                .map((discipline) => ({
                  studentId: student.id,
                  disciplineId: discipline.id,
                  value: demoGrade(student.id, discipline.id),
                })),
            );
            currentData = {
              students,
              disciplines,
              grades: [...grades, ...missingGrades],
              teamName:
                "teamName" in parsed && typeof parsed.teamName === "string"
                  ? parsed.teamName
                  : initialData.teamName,
              teamMembers: (() => {
                if (!("teamMembers" in parsed) || !Array.isArray(parsed.teamMembers)) {
                  return initialData.teamMembers;
                }
                const members = parsed.teamMembers.filter(
                  (member): member is string => typeof member === "string",
                );
                return members.length > 0 &&
                  members.every((member) => /^Integrante \d+$/.test(member))
                  ? starterTeamMembers
                  : members;
              })(),
            };
            setData(currentData);
            window.localStorage.setItem(DATA_KEY, JSON.stringify(currentData));
          } else {
            setStorageError("Os dados salvos estavam inválidos. Uma nova lista inicial foi carregada.");
            window.localStorage.setItem(DATA_KEY, JSON.stringify(initialData));
          }
        } else {
          window.localStorage.setItem(DATA_KEY, JSON.stringify(initialData));
        }

        window.localStorage.setItem(DEMO_GRADES_SEEDED_KEY, "true");

        const savedSession = window.localStorage.getItem(SESSION_KEY);
        if (savedSession) {
          const parsedSession: unknown = JSON.parse(savedSession);
          if (
            typeof parsedSession === "object" &&
            parsedSession !== null &&
            "role" in parsedSession &&
            (parsedSession.role === "admin" ||
              (parsedSession.role === "student" &&
                "studentId" in parsedSession &&
                typeof parsedSession.studentId === "string" &&
                currentData.students.some((student) => student.id === parsedSession.studentId)))
          ) {
            setSession(parsedSession as UserSession);
            setSection(parsedSession.role === "admin" ? "overview" : "grades");
          }
        }
      } catch {
        setStorageError("Não foi possível ler os dados deste navegador. Verifique as permissões de armazenamento.");
      } finally {
        setLoaded(true);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  function persistData(update: (current: SchoolData) => SchoolData) {
    const updated = update(data);
    setData(updated);
    try {
      window.localStorage.setItem(DATA_KEY, JSON.stringify(updated));
      setStorageError("");
    } catch {
      setStorageError("Não foi possível salvar. O armazenamento local pode estar cheio ou indisponível.");
    }
  }

  const currentStudent =
    session?.role === "student"
      ? data.students.find((student) => student.id === session.studentId)
      : undefined;
  const isAdmin = session?.role === "admin";

  const filteredStudents = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("pt-BR");
    if (!term) return data.students;
    return data.students.filter(
      (student) =>
        student.name.toLocaleLowerCase("pt-BR").includes(term) ||
        student.id.includes(term) ||
        student.email.toLocaleLowerCase("pt-BR").includes(term),
    );
  }, [data.students, query]);

  const recordedGrades = data.grades.filter((grade) => grade.value !== null);
  const classAverage = average(data.grades.map((grade) => grade.value));
  const approvedCount = recordedGrades.filter((grade) => grade.value !== null && grade.value >= 7).length;
  const pendingCount = data.grades.length - recordedGrades.length;

  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError("");
    const email = loginEmail.trim().toLocaleLowerCase("pt-BR");
    let nextSession: UserSession | null = null;

    if (email === "admin@escola.com" && loginPassword === "admin123") {
      nextSession = { role: "admin" };
    } else {
      const student = data.students.find(
        (item) => item.id === loginEmail.trim() && loginPassword === "aluno123",
      );
      if (student) nextSession = { role: "student", studentId: student.id };
    }

    if (!nextSession) {
      setLoginError("E-mail/matrícula ou senha incorretos.");
      return;
    }

    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      setSection(nextSession.role === "admin" ? "overview" : "grades");
      setLoginPassword("");
    } catch {
      setLoginError("Não foi possível iniciar a sessão porque o armazenamento local está indisponível.");
    }
  }

  function signOut() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      setSession(null);
      setSection("overview");
    } catch {
      setStorageError("Não foi possível encerrar a sessão neste navegador.");
    }
  }

  function saveStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.type !== "student") return;
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    const id = String(values.get("id") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const classroom = String(values.get("classroom") ?? "").trim();
    if (!name || !id || !email || !classroom) return;

    if (data.students.some((student) => student.id === id && student.id !== modal.id)) {
      setNotice("Já existe um aluno com essa matrícula.");
      return;
    }

    if (modal.mode === "create") {
      const student = { id, name, email, classroom };
      persistData((current) => ({
        ...current,
        students: [...current.students, student],
        grades: [
          ...current.grades,
          ...current.disciplines.map((discipline) => ({
            studentId: id,
            disciplineId: discipline.id,
            value: null,
          })),
        ],
      }));
      setNotice("Aluno cadastrado com sucesso.");
    } else {
      persistData((current) => ({
        ...current,
        students: current.students.map((student) =>
          student.id === modal.id ? { id, name, email, classroom } : student,
        ),
      }));
      setNotice("Cadastro do aluno atualizado.");
    }
    setModal(null);
  }

  function saveDiscipline(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.type !== "discipline") return;
    const values = new FormData(event.currentTarget);
    const name = String(values.get("name") ?? "").trim();
    const teacher = String(values.get("teacher") ?? "").trim();
    if (!name || !teacher) return;

    if (data.disciplines.some((item) => item.name.toLocaleLowerCase("pt-BR") === name.toLocaleLowerCase("pt-BR") && item.id !== modal.id)) {
      setNotice("Já existe uma disciplina com esse nome.");
      return;
    }

    if (modal.mode === "create") {
      const discipline: Discipline = {
        id: `d-${crypto.randomUUID()}`,
        name,
        teacher,
        color: ["mint", "lavender", "peach", "blue"][data.disciplines.length % 4],
      };
      persistData((current) => ({
        ...current,
        disciplines: [...current.disciplines, discipline],
        grades: [
          ...current.grades,
          ...current.students.map((student) => ({
            studentId: student.id,
            disciplineId: discipline.id,
            value: null,
          })),
        ],
      }));
      setNotice("Disciplina criada. As médias dos alunos iniciam sem nota.");
    } else {
      persistData((current) => ({
        ...current,
        disciplines: current.disciplines.map((item) =>
          item.id === modal.id ? { ...item, name, teacher } : item,
        ),
      }));
      setNotice("Disciplina atualizada.");
    }
    setModal(null);
  }

  function saveGrade(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!modal || modal.type !== "grade") return;
    const values = new FormData(event.currentTarget);
    const studentId = String(values.get("studentId") ?? "");
    const disciplineId = String(values.get("disciplineId") ?? "");
    const rawValue = String(values.get("value") ?? "").trim();
    const value = rawValue === "" ? null : Number(rawValue);
    if (
      !data.students.some((student) => student.id === studentId) ||
      !data.disciplines.some((discipline) => discipline.id === disciplineId) ||
      (value !== null && (!Number.isFinite(value) || value < 0 || value > 10))
    ) {
      setNotice("Confira os campos. A média deve estar entre 0 e 10.");
      return;
    }

    persistData((current) => ({
      ...current,
      grades: current.grades.map((grade) =>
        grade.studentId === studentId && grade.disciplineId === disciplineId
          ? { ...grade, value }
          : grade,
      ),
    }));
    setNotice(value === null ? "Média removida." : "Média atualizada com sucesso.");
    setModal(null);
  }

  function deleteStudent(student: Student) {
    if (!window.confirm(`Excluir o cadastro de ${student.name} e suas médias?`)) return;
    persistData((current) => ({
      ...current,
      students: current.students.filter((item) => item.id !== student.id),
      grades: current.grades.filter((grade) => grade.studentId !== student.id),
    }));
    setNotice("Aluno e médias relacionadas removidos.");
  }

  function deleteDiscipline(discipline: Discipline) {
    if (!window.confirm(`Excluir a disciplina ${discipline.name} e todas as médias dela?`)) return;
    persistData((current) => ({
      ...current,
      disciplines: current.disciplines.filter((item) => item.id !== discipline.id),
      grades: current.grades.filter((grade) => grade.disciplineId !== discipline.id),
    }));
    setNotice("Disciplina e médias relacionadas removidas.");
  }

  function openCreate(type: "student" | "discipline" | "grade") {
    setNotice("");
    setModal({ type, mode: "create" });
  }

  function openEdit(type: "student" | "discipline" | "grade", id: string) {
    setNotice("");
    setModal({ type, mode: "edit", id });
  }

  if (!loaded) {
    return <main className="loading-screen"><span className="loading-mark">e.</span><span>Preparando seu espaço...</span></main>;
  }

  if (!session || (session.role === "student" && !currentStudent)) {
    return (
      <main className="login-screen">
        <section className="login-story">
          <div className="brand brand-light"><span className="brand-mark">e.</span><span>escola<span className="brand-dot">.</span>online</span></div>
          <div className="story-content">
            <span className="eyebrow light-eyebrow"><span className="eyebrow-line" />PORTAL ACADÊMICO 2DSB</span>
            <h1>Aprender fica<br />melhor quando<br /><span>você acompanha.</span></h1>
            <p>Um espaço simples para cuidar das turmas, organizar disciplinas e acompanhar cada conquista.</p>
            <div className="story-note"><span className="note-icon"><Icon name="cap" size={22} /></span><span><strong>Seu próximo passo começa aqui.</strong><small>Notas e rotina escolar em um só lugar.</small></span></div>
          </div>
          <div className="story-footer"><span>PROGRAMAÇÃO WEB I</span><span>ANO LETIVO 2025</span></div>
          <span className="story-orbit orbit-one" /><span className="story-orbit orbit-two" />
        </section>

        <section className="login-panel">
          <div className="login-top"><span className="brand brand-dark"><span className="brand-mark">e.</span><span>escola<span className="brand-dot">.</span>online</span></span><span className="secure-label"><Icon name="lock" size={14} /> ACESSO SEGURO</span></div>
          <div className="login-form-wrap">
            <span className="eyebrow"><span className="eyebrow-line" />BEM-VINDO(A) DE VOLTA</span>
            <h2>Entre na sua conta</h2>
            <p className="login-subtitle">Acesse seu espaço usando suas credenciais.</p>
            <form className="login-form" onSubmit={signIn}>
              <label htmlFor="login-email">E-mail ou matrícula</label>
              <input id="login-email" autoComplete="username" value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} placeholder="Digite seu e-mail ou matrícula" required />
              <div className="password-label"><label htmlFor="login-password">Senha</label><span>Senha de demonstração</span></div>
              <input id="login-password" type="password" autoComplete="current-password" value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} placeholder="Digite sua senha" required />
              {loginError && <p className="form-error" role="alert">{loginError}</p>}
              <button className="button button-primary login-submit" type="submit">Entrar na plataforma <Icon name="arrow" size={18} /></button>
            </form>
            <div className="demo-access"><span className="demo-caption">ACESSO PARA TESTE</span><button type="button" className="demo-option" onClick={() => { setLoginEmail(data.students[0]?.id ?? "2025001"); setLoginPassword("aluno123"); setLoginError(""); }}><span className="demo-avatar student-avatar">AL</span><span><strong>Aluno</strong><small>Matrícula 2025001 · aluno123</small></span><Icon name="chevron" size={16} /></button></div>
          </div>
          <div className="login-foot"><span>© 2025 Escola Online · Projeto 2DS</span><span>Precisa de ajuda? <a href="mailto:suporte@escola.edu.br">Fale com a escola</a></span></div>
        </section>
      </main>
    );
  }

  const navItems: { id: Section; label: string; icon: string }[] = isAdmin
    ? [
        { id: "overview", label: "Visão geral", icon: "grid" },
        { id: "students", label: "Alunos", icon: "users" },
        { id: "disciplines", label: "Disciplinas", icon: "book" },
        { id: "grades", label: "Médias", icon: "chart" },
        { id: "team", label: "Nossa equipe", icon: "team" },
        { id: "how", label: "Como funciona o aplicativo", icon: "play" },
      ]
    : [
        { id: "grades", label: "Meu boletim", icon: "chart" },
        { id: "team", label: "Nossa equipe", icon: "team" },
        { id: "how", label: "Como funciona o aplicativo", icon: "play" },
      ];

  const studentGrades = currentStudent
    ? data.grades.filter((grade) => grade.studentId === currentStudent.id)
    : [];
  const studentAverage = average(studentGrades.map((grade) => grade.value));
  const titleBySection: Record<Section, string> = {
    overview: "Visão geral",
    students: "Alunos",
    disciplines: "Disciplinas",
    grades: isAdmin ? "Médias" : "Meu boletim",
    team: "Nossa equipe",
    how: "Como funciona o aplicativo",
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <a className="brand brand-light sidebar-brand" href="#" onClick={(event) => { event.preventDefault(); setSection(isAdmin ? "overview" : "grades"); }}><span className="brand-mark">e.</span><span>escola<span className="brand-dot">.</span>online</span></a>
        <div className="school-switcher"><span className="school-emblem"><Icon name="cap" size={19} /></span><span><strong>Escola Online</strong><small>2º DS · Turma B</small></span><span className="switch-chevron">⌄</span></div>
        <span className="nav-caption">MENU PRINCIPAL</span>
        <nav className="side-nav" aria-label="Navegação principal">
          {navItems.map((item) => <button type="button" key={item.id} className={`nav-link ${section === item.id ? "active" : ""}`} onClick={() => { setSection(item.id); setQuery(""); }}><Icon name={item.icon} size={19} /><span>{item.label}</span>{item.id === "grades" && isAdmin && pendingCount > 0 && <span className="nav-count">{pendingCount}</span>}</button>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-spark">✳</span><strong>Estamos aqui<br />para ajudar.</strong><span>Precisa de suporte com a plataforma?</span><a href="mailto:suporte@escola.edu.br">Fale com a gente <Icon name="arrow" size={14} /></a></div>
          <button type="button" className="nav-link logout-link" onClick={signOut}><Icon name="logout" size={19} /><span>Sair da conta</span></button>
          <div className="sidebar-meta"><span>ESCOLA ONLINE · 2025</span><span>FEITO PARA APRENDER <span className="tiny-heart">♥</span></span></div>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar"><div className="mobile-brand"><span className="brand-mark">e.</span><span>escola<span className="brand-dot">.</span>online</span></div><div className="breadcrumb"><span>Escola Online</span><Icon name="chevron" size={14} /><strong>{titleBySection[section]}</strong></div><div className="topbar-actions"><span className="today-label"><Icon name="calendar" size={16} /> Quarta-feira, 12 de novembro</span><button type="button" className="icon-button notification-button" aria-label="Notificações"><Icon name="bell" size={19} /><i /></button><span className="topbar-divider" /><button type="button" className="icon-button mobile-logout" onClick={signOut} aria-label="Sair da conta"><Icon name="logout" size={18} /></button><div className="profile-chip"><span className={`avatar ${isAdmin ? "avatar-admin" : ""}`}>{initials(isAdmin ? "Administração" : currentStudent?.name ?? "Aluno")}</span><span><strong>{isAdmin ? "Administração" : currentStudent?.name.split(" ")[0]}</strong><small>{isAdmin ? "Administrador" : "Estudante · 2º DS"}</small></span><span className="switch-chevron">⌄</span></div></div></header>

        {storageError && <div className="storage-alert" role="alert"><span>{storageError}</span><button type="button" onClick={() => setStorageError("")} aria-label="Fechar aviso"><Icon name="close" size={15} /></button></div>}
        {notice && <div className="notice-alert" role="status"><Icon name="check" size={16} /><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Fechar aviso"><Icon name="close" size={15} /></button></div>}
        <div className="demo-average-banner"><Icon name="chart" size={16} /><span>Médias fictícias para demonstração. Você pode editá-las na área de médias.</span></div>

        <div className="page-content">
          {section === "overview" && isAdmin && (
            <>
              <div className="page-heading"><div><span className="eyebrow"><span className="eyebrow-line" />QUARTA-FEIRA, 12 DE NOVEMBRO DE 2025</span><h1>Bom dia, equipe <span className="heading-spark">✳</span></h1><p>Aqui está o resumo da sua turma. Um passo de cada vez!</p></div><button type="button" className="button button-primary" onClick={() => openCreate("student")}><Icon name="plus" size={18} /> Novo aluno</button></div>
              <div className="stats-grid">
                <article className="stat-card stat-indigo"><span className="stat-icon"><Icon name="users" size={19} /></span><span className="stat-label">ALUNOS MATRICULADOS</span><strong>{data.students.length.toString().padStart(2, "0")}</strong><span className="stat-foot"><span className="stat-dot" /> Turma 2º DS B</span><span className="stat-watermark">01</span></article>
                <article className="stat-card stat-lime"><span className="stat-icon"><Icon name="book" size={19} /></span><span className="stat-label">DISCIPLINAS ATIVAS</span><strong>{data.disciplines.length.toString().padStart(2, "0")}</strong><span className="stat-foot"><span className="stat-dot" /> Neste semestre</span><span className="stat-watermark">02</span></article>
                <article className="stat-card stat-peach"><span className="stat-icon"><Icon name="chart" size={19} /></span><span className="stat-label">MÉDIA DA TURMA</span><strong>{classAverage === null ? "—" : formatGrade(classAverage)}</strong><span className="stat-foot">{classAverage === null ? "Aguardando lançamentos" : <><span className="stat-dot" /> Notas lançadas</>}</span><span className="stat-watermark">03</span></article>
                <article className="stat-card stat-lavender"><span className="stat-icon"><Icon name="check" size={19} /></span><span className="stat-label">MÉDIAS APROVADAS</span><strong>{approvedCount.toString().padStart(2, "0")}</strong><span className="stat-foot"><span className="stat-dot" /> De {recordedGrades.length} notas lançadas</span><span className="stat-watermark">04</span></article>
              </div>
              <div className="overview-grid">
                <section className="panel recent-panel"><div className="panel-heading"><div><span className="eyebrow"><span className="eyebrow-line" />ACOMPANHAMENTO</span><h2>Alunos da turma</h2></div><button type="button" className="text-link" onClick={() => setSection("students")}>Ver todos <Icon name="arrow" size={16} /></button></div><div className="student-table-wrap"><table className="data-table"><thead><tr><th>ALUNO</th><th>MATRÍCULA</th><th>MÉDIA GERAL</th><th>SITUAÇÃO</th></tr></thead><tbody>{data.students.slice(0, 5).map((student, index) => { const studentAverage = average(data.grades.filter((grade) => grade.studentId === student.id).map((grade) => grade.value)); return <tr key={student.id}><td><div className="person-cell"><span className={`avatar avatar-color-${index % 5}`}>{initials(student.name)}</span><span><strong>{student.name}</strong><small>{student.email}</small></span></div></td><td className="id-cell">{student.id}</td><td className="grade-cell">{formatGrade(studentAverage)}</td><td>{studentAverage === null ? <span className="status-badge neutral">Aguardando</span> : <StatusBadge value={studentAverage} />}</td></tr>; })}{!data.students.length && <tr><td className="empty-cell" colSpan={4}>Nenhum aluno cadastrado.</td></tr>}</tbody></table></div><button type="button" className="mobile-view-all" onClick={() => setSection("students")}>Ver todos os alunos <Icon name="arrow" size={16} /></button></section>
                <section className="panel disciplines-panel"><div className="panel-heading"><div><span className="eyebrow"><span className="eyebrow-line" />GRADE CURRICULAR</span><h2>Disciplinas</h2></div><button type="button" className="icon-button subtle-button" aria-label="Ver disciplinas" onClick={() => setSection("disciplines")}><Icon name="arrow" size={17} /></button></div><div className="discipline-list">{data.disciplines.slice(0, 5).map((discipline, index) => <div className="discipline-row" key={discipline.id}><span className={`discipline-icon ${discipline.color}`}><Icon name={index % 2 ? "chart" : "book"} size={18} /></span><span className="discipline-info"><strong>{discipline.name}</strong><small>{discipline.teacher}</small></span><span className="discipline-count">{data.grades.filter((grade) => grade.disciplineId === discipline.id && grade.value !== null).length}/{data.students.length}</span></div>)}{!data.disciplines.length && <p className="empty-message">Nenhuma disciplina cadastrada.</p>}</div><div className="discipline-progress"><div><span>Médias pendentes</span><strong>{pendingCount}</strong></div><div className="progress-track"><span style={{ width: `${data.grades.length ? (recordedGrades.length / data.grades.length) * 100 : 0}%` }} /></div><small>{recordedGrades.length} de {data.grades.length} médias lançadas</small></div></section>
              </div>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>PROGRAMAÇÃO WEB I <i>·</i> FEITO PARA APRENDER</span></div>
            </>
          )}

          {section === "students" && isAdmin && (
            <>
              <div className="page-heading compact-heading"><div><span className="eyebrow"><span className="eyebrow-line" />GESTÃO ESCOLAR</span><h1>Alunos <span className="heading-spark">✳</span></h1><p>Gerencie as matrículas e acompanhe o desempenho da turma.</p></div><button type="button" className="button button-primary" onClick={() => openCreate("student")}><Icon name="plus" size={18} /> Novo aluno</button></div>
              <section className="panel full-panel"><div className="list-toolbar"><div><h2>Todos os alunos <span className="result-count">{data.students.length}</span></h2><p>Turma 2º DS B · Ano letivo 2025</p></div><label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aluno..." aria-label="Buscar aluno" /><kbd>⌘ K</kbd></label></div><div className="student-table-wrap"><table className="data-table management-table"><thead><tr><th>ALUNO</th><th>MATRÍCULA</th><th>E-MAIL</th><th>MÉDIA GERAL</th><th>SITUAÇÃO</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{filteredStudents.map((student, index) => { const studentAverage = average(data.grades.filter((grade) => grade.studentId === student.id).map((grade) => grade.value)); return <tr key={student.id}><td><div className="person-cell"><span className={`avatar avatar-color-${index % 5}`}>{initials(student.name)}</span><span><strong>{student.name}</strong><small>{student.classroom}</small></span></div></td><td className="id-cell">{student.id}</td><td className="email-cell">{student.email}</td><td className="grade-cell">{formatGrade(studentAverage)}</td><td>{studentAverage === null ? <span className="status-badge neutral">Aguardando</span> : <StatusBadge value={studentAverage} />}</td><td><div className="row-actions"><button type="button" className="icon-button" aria-label={`Editar ${student.name}`} onClick={() => openEdit("student", student.id)}><Icon name="edit" size={16} /></button><button type="button" className="icon-button danger-action" aria-label={`Excluir ${student.name}`} onClick={() => deleteStudent(student)}><Icon name="trash" size={16} /></button></div></td></tr>; })}{!filteredStudents.length && <tr><td className="empty-cell" colSpan={6}>Nenhum aluno encontrado.</td></tr>}</tbody></table></div><div className="table-foot"><span>Exibindo {filteredStudents.length} de {data.students.length} alunos</span><span>Os dados são salvos neste navegador</span></div></section>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>GESTÃO DE ALUNOS <i>·</i> LOCAL</span></div>
            </>
          )}

          {section === "disciplines" && isAdmin && (
            <>
              <div className="page-heading compact-heading"><div><span className="eyebrow"><span className="eyebrow-line" />ORGANIZAÇÃO ACADÊMICA</span><h1>Disciplinas <span className="heading-spark">✳</span></h1><p>Organize as matérias e seus responsáveis pela turma.</p></div><button type="button" className="button button-primary" onClick={() => openCreate("discipline")}><Icon name="plus" size={18} /> Nova disciplina</button></div>
              <div className="subject-summary"><div><span className="summary-icon"><Icon name="book" size={19} /></span><span><strong>{data.disciplines.length} disciplinas</strong><small>ativas neste semestre</small></span></div><span className="summary-divider" /><div><span className="summary-icon summary-icon-lime"><Icon name="users" size={19} /></span><span><strong>{data.students.length} alunos</strong><small>matriculados na turma</small></span></div><span className="summary-note">Todas as médias começam sem nota <span>✳</span></span></div>
              <div className="subject-grid">{data.disciplines.map((discipline, index) => { const grades = data.grades.filter((grade) => grade.disciplineId === discipline.id); const count = grades.filter((grade) => grade.value !== null).length; const subjectAverage = average(grades.map((grade) => grade.value)); return <article className="subject-card" key={discipline.id}><div className="subject-card-top"><span className={`subject-symbol ${discipline.color}`}><Icon name={index % 2 ? "chart" : "book"} size={21} /></span><div className="row-actions"><button type="button" className="icon-button" aria-label={`Editar ${discipline.name}`} onClick={() => openEdit("discipline", discipline.id)}><Icon name="edit" size={16} /></button><button type="button" className="icon-button danger-action" aria-label={`Excluir ${discipline.name}`} onClick={() => deleteDiscipline(discipline)}><Icon name="trash" size={16} /></button></div></div><span className="subject-code">DISCIPLINA {String(index + 1).padStart(2, "0")}</span><h2>{discipline.name}</h2><p>{discipline.teacher}</p><div className="subject-card-bottom"><span><strong>{count}</strong> de {data.students.length} médias lançadas</span><span className="subject-average">{subjectAverage === null ? "—" : formatGrade(subjectAverage)}<small> média</small></span></div><div className="progress-track subject-progress"><span style={{ width: `${grades.length ? (count / grades.length) * 100 : 0}%` }} /></div></article>; })}{!data.disciplines.length && <div className="panel empty-panel">Nenhuma disciplina cadastrada ainda. Crie a primeira para começar.</div>}</div>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>GRADE CURRICULAR <i>·</i> LOCAL</span></div>
            </>
          )}

          {section === "grades" && isAdmin && (
            <>
              <div className="page-heading compact-heading"><div><span className="eyebrow"><span className="eyebrow-line" />ACOMPANHAMENTO DE DESEMPENHO</span><h1>Médias da turma <span className="heading-spark">✳</span></h1><p>Lance e atualize as médias por aluno e disciplina.</p></div><button type="button" className="button button-primary" onClick={() => openCreate("grade")}><Icon name="plus" size={18} /> Lançar média</button></div>
              <div className="grade-summary-row"><div className="summary-tile"><span className="summary-tile-icon grade-tile-indigo"><Icon name="chart" size={19} /></span><span><small>MÉDIA GERAL DA TURMA</small><strong>{classAverage === null ? "—" : formatGrade(classAverage)}</strong></span></div><div className="summary-tile"><span className="summary-tile-icon grade-tile-green"><Icon name="check" size={19} /></span><span><small>MÉDIAS APROVADAS</small><strong>{approvedCount} <i>/ {recordedGrades.length}</i></strong></span></div><div className="summary-tile"><span className="summary-tile-icon grade-tile-orange"><Icon name="calendar" size={19} /></span><span><small>AGUARDANDO LANÇAMENTO</small><strong>{pendingCount}</strong></span></div></div>
              <section className="panel full-panel grade-panel"><div className="list-toolbar"><div><h2>Boletim da turma</h2><p>Selecione uma média para editar ou remover a nota.</p></div><label className="search-field"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar aluno..." aria-label="Buscar aluno nas médias" /></label></div><div className="student-table-wrap"><table className="data-table grades-table"><thead><tr><th>ALUNO</th>{data.disciplines.map((discipline) => <th key={discipline.id}>{discipline.name.toLocaleUpperCase("pt-BR")}</th>)}<th>MÉDIA GERAL</th></tr></thead><tbody>{filteredStudents.map((student, index) => { const rows = data.grades.filter((grade) => grade.studentId === student.id); const total = average(rows.map((grade) => grade.value)); return <tr key={student.id}><td><div className="person-cell"><span className={`avatar avatar-color-${index % 5}`}>{initials(student.name)}</span><span><strong>{student.name}</strong><small>{student.id}</small></span></div></td>{data.disciplines.map((discipline) => { const grade = rows.find((item) => item.disciplineId === discipline.id); return <td key={discipline.id}><button type="button" className={`grade-value ${grade?.value === null || !grade ? "grade-empty" : ""}`} onClick={() => grade && openEdit("grade", `${student.id}|${discipline.id}`)} aria-label={`Editar média de ${student.name} em ${discipline.name}`}>{formatGrade(grade?.value ?? null)}{grade?.value !== null && grade && <span className="grade-edit-hint"><Icon name="edit" size={12} /></span>}</button></td>; })}<td className="grade-cell">{formatGrade(total)}</td></tr>; })}{!filteredStudents.length && <tr><td className="empty-cell" colSpan={data.disciplines.length + 2}>Nenhum aluno encontrado.</td></tr>}</tbody></table></div><div className="table-foot"><span>Notas de 0 a 10 · A média pode ser removida deixando o campo vazio</span><span>Persistência local ativada</span></div></section>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>BOLETIM ESCOLAR <i>·</i> LOCAL</span></div>
            </>
          )}

          {section === "grades" && !isAdmin && currentStudent && (
            <>
              <div className="page-heading compact-heading"><div><span className="eyebrow"><span className="eyebrow-line" />SEU DESEMPENHO</span><h1>Meu boletim <span className="heading-spark">✳</span></h1><p>Oi, {currentStudent.name.split(" ")[0]}! Acompanhe suas médias e celebre cada avanço.</p></div><span className="class-tag"><Icon name="cap" size={17} /> {currentStudent.classroom}</span></div>
              <div className="student-report-hero"><div className="report-illustration"><span className="report-star">✳</span><Icon name="cap" size={48} /></div><div className="report-copy"><span>ANO LETIVO 2025 <i>·</i> BOLETIM PARCIAL</span><h2>{studentAverage === null ? "Sua jornada está começando!" : "Continue assim, você está indo bem!"}</h2><p>{studentAverage === null ? "Suas médias aparecerão aqui assim que forem lançadas pelos professores." : "Acompanhe abaixo seu resultado em cada disciplina."}</p></div><div className="report-score"><small>MÉDIA GERAL</small><strong>{studentAverage === null ? "—" : formatGrade(studentAverage)}</strong><span>{studentAverage === null ? "sem notas lançadas" : "de 10,0 pontos"}</span></div></div>
              <section className="panel report-panel"><div className="panel-heading"><div><span className="eyebrow"><span className="eyebrow-line" />RESULTADOS POR MATÉRIA</span><h2>Suas disciplinas</h2></div><span className="report-count">{data.disciplines.length} disciplinas</span></div><div className="report-list">{data.disciplines.map((discipline, index) => { const grade = studentGrades.find((item) => item.disciplineId === discipline.id); const value = grade?.value ?? null; return <div className="report-row" key={discipline.id}><span className={`discipline-icon ${discipline.color}`}><Icon name={index % 2 ? "chart" : "book"} size={18} /></span><span className="report-discipline"><strong>{discipline.name}</strong><small>{discipline.teacher}</small></span><span className="report-grade">{formatGrade(value)}<small>/ 10</small></span><StatusBadge value={value} /><span className="report-bar"><span style={{ width: `${value === null ? 0 : value * 10}%` }} /></span></div>; })}{!data.disciplines.length && <p className="empty-message">Nenhuma disciplina cadastrada ainda.</p>}</div>              <div className="grading-legend"><span><i className="legend-dot legend-success" />Aprovado: 7,0 ou mais</span><span><i className="legend-dot legend-warning" />Recuperação: 6,0 a 6,9</span><span><i className="legend-dot legend-warning" />Em avaliação: 5,0 a 5,9</span><span><i className="legend-dot legend-danger" />Reprovado: abaixo de 5,0</span></div></section>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>SEU ESPAÇO DE APRENDIZADO <i>·</i> 2025</span></div>
            </>
          )}

          {section === "team" && (
            <>
              <div className="page-heading compact-heading"><div><span className="eyebrow"><span className="eyebrow-line" />QUEM FAZ ACONTECER</span><h1>Nossa equipe <span className="heading-spark">✳</span></h1><p>As pessoas por trás deste projeto de aprendizagem.</p></div></div>
              <section className="team-intro"><span className="team-stamp">2DS<br /><small>2025</small></span><div><span className="eyebrow"><span className="eyebrow-line" />PROGRAMAÇÃO WEB I</span><h2>{data.teamName}</h2><p>Portal acadêmico desenvolvido para facilitar o acompanhamento escolar, conectar a comunidade e dar visibilidade a cada conquista.</p></div><span className="team-spark">✳</span></section>
              {isAdmin ? (
                <form
                  className="panel team-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const values = new FormData(event.currentTarget);
                    const teamName = String(values.get("teamName") ?? "").trim();
                    const teamMembers = data.teamMembers.map((_, index) =>
                      String(values.get(`member-${index}`) ?? "").trim(),
                    );
                    if (!teamName || teamMembers.some((member) => !member)) {
                      setNotice("Preencha o nome da equipe e todos os integrantes.");
                      return;
                    }
                    persistData((current) => ({ ...current, teamName, teamMembers }));
                    setNotice("Identificação da equipe salva.");
                  }}
                >
                  <div className="panel-heading">
                    <div>
                      <span className="eyebrow"><span className="eyebrow-line" />IDENTIFICAÇÃO DO PROJETO</span>
                      <h2>Edite as informações da equipe</h2>
                    </div>
                    <span className="editable-tag"><Icon name="edit" size={14} /> EDITÁVEL</span>
                  </div>
                  <label className="field-label" htmlFor="team-name">Nome da equipe</label>
                  <input id="team-name" name="teamName" className="form-control" defaultValue={data.teamName} required />
                  <div className="team-member-fields">
                    {data.teamMembers.map((member, index) => (
                      <div key={index}>
                        <label className="field-label" htmlFor={`member-${index}`}>Integrante {index + 1}</label>
                        <input id={`member-${index}`} name={`member-${index}`} className="form-control" defaultValue={member} placeholder="Digite o nome completo" required />
                      </div>
                    ))}
                  </div>
                  <div className="team-form-foot">
                    <span>Essas informações ficam salvas apenas neste navegador.</span>
                    <button type="submit" className="button button-primary"><Icon name="check" size={17} /> Salvar equipe</button>
                  </div>
                </form>
              ) : null}
              <section className="panel team-student-panel">
                <div className="panel-heading">
                  <div>
                    <span className="eyebrow"><span className="eyebrow-line" />INTEGRANTES</span>
                    <h2>Nosso time</h2>
                  </div>
                  <span className="report-count">{data.teamMembers.length} pessoas</span>
                </div>
                <div className="team-profile-grid">
                  {data.teamMembers.map((member, index) => {
                    const profile = teamProfiles[index];
                    return (
                      <article className="team-profile-card" key={`${member}-${index}`}>
                        <img
                          className="team-profile-photo"
                          src={profile?.photo || "/images/equipe/perfil-padrao.svg"}
                          alt={`Foto de ${member}`}
                        />
                        <h3>{member}</h3>
                        <p>Equipe de desenvolvimento</p>
                        {profile?.github ? (
                          <a className="team-github-link" href={profile.github} target="_blank" rel="noreferrer">
                            Ver GitHub <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <span className="team-github-pending">Link do GitHub será adicionado</span>
                        )}
                      </article>
                    );
                  })}
                </div>
              </section>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>FEITO COM <i className="tiny-heart">♥</i> PELA EQUIPE</span></div>
            </>
          )}

          {section === "how" && (
            <>
              <div className="page-heading compact-heading">
                <div>
                  <span className="eyebrow"><span className="eyebrow-line" />CONHEÇA A PLATAFORMA</span>
                  <h1>Como funciona o aplicativo <span className="heading-spark">✳</span></h1>
                  <p>Assista ao vídeo para conhecer as principais funções do Escola Online.</p>
                </div>
              </div>
              <section className="panel how-video-panel">
                <div className="panel-heading">
                  <div><span className="eyebrow"><span className="eyebrow-line" />TUTORIAL</span><h2>Aprenda a usar o aplicativo</h2></div>
                </div>
                {getYoutubeEmbedUrl(YOUTUBE_VIDEO_URL) ? (
                  <div className="youtube-frame-wrap">
                    <iframe
                      src={getYoutubeEmbedUrl(YOUTUBE_VIDEO_URL)}
                      title="Como funciona o aplicativo Escola Online"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      referrerPolicy="strict-origin-when-cross-origin"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="youtube-placeholder">
                    <span className="youtube-placeholder-icon"><Icon name="play" size={28} /></span>
                    <strong>O vídeo será exibido aqui</strong>
                    <p>Assim que o link do YouTube for inserido no código, você poderá assistir diretamente nesta página.</p>
                  </div>
                )}
              </section>
              <div className="page-footer"><span>© 2025 Escola Online · Projeto 2DS</span><span>APRENDA A USAR A PLATAFORMA</span></div>
            </>
          )}
        </div>
      </section>

      {modal && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(null); }}>
          <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
            <div className="modal-heading"><div><span className="eyebrow"><span className="eyebrow-line" />{modal.mode === "create" ? "NOVO CADASTRO" : "ATUALIZAÇÃO"}</span><h2 id="modal-title">{modal.type === "student" ? modal.mode === "create" ? "Adicionar aluno" : "Editar aluno" : modal.type === "discipline" ? modal.mode === "create" ? "Nova disciplina" : "Editar disciplina" : modal.mode === "create" ? "Lançar média" : "Editar média"}</h2><p>{modal.type === "grade" ? "Notas entre 0 e 10. Deixe em branco para remover a média." : "Preencha os dados abaixo para continuar."}</p></div><button type="button" className="icon-button modal-close" onClick={() => setModal(null)} aria-label="Fechar"><Icon name="close" size={19} /></button></div>
            {modal.type === "student" && (() => { const student = modal.mode === "edit" ? data.students.find((item) => item.id === modal.id) : undefined; return <form className="modal-form" onSubmit={saveStudent}><label className="field-label" htmlFor="student-name">Nome completo</label><input id="student-name" name="name" className="form-control" defaultValue={student?.name} placeholder="Ex.: Maria da Silva" required /><div className="form-two-col"><div><label className="field-label" htmlFor="student-id">Matrícula</label><input id="student-id" name="id" className="form-control" defaultValue={student?.id} placeholder="Ex.: 2025011" readOnly={Boolean(student)} required /></div><div><label className="field-label" htmlFor="student-class">Turma</label><input id="student-class" name="classroom" className="form-control" defaultValue={student?.classroom ?? "2º DS B"} required /></div></div><label className="field-label" htmlFor="student-email">E-mail</label><input id="student-email" name="email" type="email" className="form-control" defaultValue={student?.email} placeholder="aluno@escola.edu.br" required /><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button button-primary"><Icon name="check" size={17} />{modal.mode === "create" ? "Cadastrar aluno" : "Salvar alterações"}</button></div></form>; })()}
            {modal.type === "discipline" && (() => { const discipline = modal.mode === "edit" ? data.disciplines.find((item) => item.id === modal.id) : undefined; return <form className="modal-form" onSubmit={saveDiscipline}><label className="field-label" htmlFor="discipline-name">Nome da disciplina</label><input id="discipline-name" name="name" className="form-control" defaultValue={discipline?.name} placeholder="Ex.: Lógica de Programação" required /><label className="field-label" htmlFor="discipline-teacher">Professor(a)</label><input id="discipline-teacher" name="teacher" className="form-control" defaultValue={discipline?.teacher} placeholder="Ex.: Prof. João" required /><p className="form-hint"><Icon name="check" size={15} /> Novas disciplinas começam com média não lançada para todos.</p><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button button-primary"><Icon name="check" size={17} />{modal.mode === "create" ? "Criar disciplina" : "Salvar alterações"}</button></div></form>; })()}
            {modal.type === "grade" && (() => { const existing = modal.mode === "edit" && modal.id ? modal.id.split("|") : []; const selectedStudentId = existing[0] ?? data.students[0]?.id ?? ""; const selectedDisciplineId = existing[1] ?? data.disciplines[0]?.id ?? ""; const existingGrade = data.grades.find((grade) => grade.studentId === selectedStudentId && grade.disciplineId === selectedDisciplineId); return <form className="modal-form" onSubmit={saveGrade}><label className="field-label" htmlFor="grade-student">Aluno</label><select id="grade-student" name="studentId" className="form-control" defaultValue={selectedStudentId} required disabled={modal.mode === "edit"}>{data.students.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.id}</option>)}</select><label className="field-label" htmlFor="grade-discipline">Disciplina</label><select id="grade-discipline" name="disciplineId" className="form-control" defaultValue={selectedDisciplineId} required disabled={modal.mode === "edit"}>{data.disciplines.map((discipline) => <option key={discipline.id} value={discipline.id}>{discipline.name}</option>)}</select><label className="field-label" htmlFor="grade-value">Média <span className="optional-label">0,0 a 10,0</span></label><input id="grade-value" name="value" type="number" className="form-control grade-input" min="0" max="10" step="0.1" defaultValue={existingGrade?.value ?? ""} placeholder="Ex.: 8,5" /><p className="form-hint"><Icon name="check" size={15} /> Situação calculada automaticamente após salvar.</p><div className="modal-actions"><button type="button" className="button button-secondary" onClick={() => setModal(null)}>Cancelar</button><button type="submit" className="button button-primary"><Icon name="check" size={17} />Salvar média</button></div></form>; })()}
          </section>
        </div>
      )}
    </main>
  );
}

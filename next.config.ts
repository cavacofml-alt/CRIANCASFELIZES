import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Impede o `next dev` de reescrever automaticamente o CLAUDE.md (o
  // ficheiro de instruções do projeto, escrito à mão, não gerado).
  agentRules: false,
};

export default nextConfig;

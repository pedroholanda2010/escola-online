# Escola Online — Portal Acadêmico 2DSB

Aplicação responsiva para administração de alunos, disciplinas e médias, com acesso de consulta ao boletim do estudante. Os dados e a sessão são armazenados no `localStorage` do navegador.

## Executar

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

## Acesso de demonstração

- **Aluno:** matrícula `2025001` / `aluno123`

O sistema inicia com 10 alunos, 20 disciplinas (4 técnicas e 16 comuns do ensino médio) e médias sem lançamento. As funções de gestão ficam disponíveis somente na sessão de administrador. No acesso de administrador é possível criar, consultar, editar e excluir alunos e disciplinas, além de lançar, editar e remover médias. A página **Nossa equipe** permite atualizar o nome da equipe e dos integrantes.

Integrantes da equipe: Antônia Heloísa, Aline Azevedo e Pedro Henrique.

## Situação das médias

- Abaixo de 5,0: reprovado
- De 5,0 até abaixo de 6,0: em avaliação
- De 6,0 até abaixo de 7,0: recuperação
- A partir de 7,0: aprovado
- Sem lançamento: sem nota

> **Observação:** este é um projeto demonstrativo escolar. Como a autenticação e os dados ficam no navegador, o controle de acesso não substitui autenticação ou armazenamento seguros em um servidor para uso real.

## Personalizar a página Nossa equipe e o tutorial

- As fotos de exemplo ficam em `public/images/equipe/`. Substitua `antonia.svg`, `aline.svg` e `pedro.svg` pelas fotos reais ou atualize os caminhos em `teamProfiles`, no início de `app/page.tsx`.
- Para adicionar os perfis do GitHub, preencha os campos `github` do array `teamProfiles`, no início de `app/page.tsx`, com o endereço completo de cada perfil (por exemplo, `https://github.com/usuario`).
- Para incorporar o vídeo, preencha `YOUTUBE_VIDEO_URL`, também no início de `app/page.tsx`, com o link normal do YouTube. O aplicativo converte o endereço para o formato de incorporação automaticamente.

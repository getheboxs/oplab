import ts from "typescript";

export function transpileIfNeeded(code: string, bahasa: "javascript" | "typescript"): string {
  if (bahasa !== "typescript") return code;

  const result = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.None,
      target: ts.ScriptTarget.ES2020,
      removeComments: false,
    },
  });

  return result.outputText;
}

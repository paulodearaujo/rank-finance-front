"use client";

import { hammingDistance } from "./image-hash";

export type ScreenshotStatus = "unchanged" | "moved" | "changed" | "new";

interface ScreenshotComparisonResult {
  status: ScreenshotStatus;
  matchIndex: number | null;
}

const DHASH_THRESHOLD = 6; // <=6 bits difference = visually identical

/**
 * Compara uma screenshot atual com as screenshots anteriores
 * usando hash visual como fonte primária de verdade.
 *
 * @param currentIndex - Índice da screenshot atual
 * @param currentHash - Hash visual da screenshot atual
 * @param previousHashes - Array de hashes das screenshots anteriores
 * @returns Status da comparação e informações do match
 */
export function compareScreenshot(
  currentIndex: number,
  currentHash: string | null | undefined,
  previousHashes: (string | null)[],
): ScreenshotComparisonResult {
  // Se não há screenshots anteriores, é nova
  if (previousHashes.length === 0) {
    return {
      status: "new",
      matchIndex: null,
    };
  }

  // Se não temos hash da imagem atual, não podemos comparar
  if (!currentHash) {
    return {
      status: "unchanged",
      matchIndex: null,
    };
  }

  // Se nem todos os hashes anteriores estão calculados, aguarda
  const hasAllPreviousHashes = previousHashes.every((h) => h !== null);
  if (!hasAllPreviousHashes) {
    return {
      status: "unchanged",
      matchIndex: null,
    };
  }

  // Procura a melhor correspondência visual
  let bestMatch = -1;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < previousHashes.length; i++) {
    const prevHash = previousHashes[i];
    if (!prevHash) continue;

    const distance = hammingDistance(currentHash, prevHash);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestMatch = i;
    }
  }

  // Determina o status baseado na correspondência visual
  if (bestMatch >= 0 && bestDistance <= DHASH_THRESHOLD) {
    // Encontrou match visual
    if (bestMatch === currentIndex) {
      // Mesma imagem, mesma posição
      return {
        status: "unchanged",
        matchIndex: bestMatch,
      };
    } else {
      // Mesma imagem, posição diferente
      return {
        status: "moved",
        matchIndex: bestMatch,
      };
    }
  } else if (bestMatch >= 0 && bestDistance <= DHASH_THRESHOLD * 2) {
    // Mudança significativa mas ainda reconhecível
    return {
      status: "changed",
      matchIndex: bestMatch,
    };
  } else {
    // Nenhuma correspondência visual - é nova
    return {
      status: "new",
      matchIndex: null,
    };
  }
}

/**
 * Compara um conjunto de screenshots atuais com anteriores.
 * Retorna um mapa de status para cada screenshot.
 */
export function compareScreenshotSets(
  currentHashes: (string | null)[],
  previousHashes: (string | null)[],
): Map<number, ScreenshotStatus> {
  const statusMap = new Map<number, ScreenshotStatus>();

  // Se não há screenshots anteriores, todas são novas
  if (previousHashes.length === 0) {
    for (let i = 0; i < currentHashes.length; i++) {
      statusMap.set(i, "new");
    }
    return statusMap;
  }

  // Aguarda todos os hashes estarem prontos
  const allHashesReady =
    currentHashes.every((h) => h !== null) && previousHashes.every((h) => h !== null);

  if (!allHashesReady) {
    // Retorna unchanged temporariamente para evitar badges piscando
    for (let i = 0; i < currentHashes.length; i++) {
      statusMap.set(i, "unchanged");
    }
    return statusMap;
  }

  // Compara cada screenshot atual
  for (let i = 0; i < currentHashes.length; i++) {
    const result = compareScreenshot(i, currentHashes[i], previousHashes);
    statusMap.set(i, result.status);
  }

  return statusMap;
}

/**
 * Verifica se todas as screenshots são visualmente idênticas
 * (permite reordenação mas não mudanças visuais)
 * @returns true se são iguais, false se diferentes, null se ainda calculando
 */
export function areScreenshotsVisuallySame(
  currentHashes: (string | null)[],
  previousHashes: (string | null)[],
): boolean | null {
  // Quick checks
  if (currentHashes.length !== previousHashes.length) return false;
  if (currentHashes.length === 0) return true;

  // Check if all hashes are ready - return null if still calculating
  if (currentHashes.some((h) => h === null)) return null;
  if (previousHashes.some((h) => h === null)) return null;

  const statusMap = compareScreenshotSets(currentHashes, previousHashes);

  // All must be unchanged or moved (no new or changed)
  for (const status of statusMap.values()) {
    if (status === "new" || status === "changed") return false;
  }
  return true;
}

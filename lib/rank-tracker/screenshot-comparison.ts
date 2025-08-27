"use client";

import { hammingDistance } from "./image-hash";

export type ScreenshotStatus = "unchanged" | "moved" | "changed" | "new";

interface ScreenshotComparisonResult {
  status: ScreenshotStatus;
  matchIndex: number | null;
}

const DHASH_THRESHOLD = 6; // <=6 bits difference = visually identical
const CHANGED_THRESHOLD = 20; // <=20 bits difference = similar but changed (ex: texto alterado)

/**
 * Compara uma screenshot atual com as screenshots anteriores
 * usando hash visual como fonte primária de verdade.
 *
 * Lógica:
 * 1. Imagem idêntica na mesma posição = unchanged
 * 2. Imagem idêntica em posição diferente = moved
 * 3. Imagem similar mas com mudanças = changed
 * 4. Imagem completamente nova = new
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
  // Se não há screenshots anteriores, todas são novas
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

  // Procura todas as correspondências e suas distâncias
  const matches: Array<{ index: number; distance: number }> = [];

  for (let i = 0; i < previousHashes.length; i++) {
    const prevHash = previousHashes[i];
    if (!prevHash) continue;

    const distance = hammingDistance(currentHash, prevHash);
    matches.push({ index: i, distance });
  }

  // Ordena por distância (menor primeiro)
  matches.sort((a, b) => a.distance - b.distance);

  // Se não há matches, é nova
  if (matches.length === 0) {
    return {
      status: "new",
      matchIndex: null,
    };
  }

  const bestMatch = matches[0];
  if (!bestMatch) {
    // Não deveria acontecer pois já verificamos matches.length > 0
    return {
      status: "new",
      matchIndex: null,
    };
  }

  // 1. Imagem idêntica (ou quase idêntica)?
  if (bestMatch.distance <= DHASH_THRESHOLD) {
    // É a mesma imagem, verifica posição
    if (bestMatch.index === currentIndex) {
      // Mesma imagem, mesma posição = unchanged
      return {
        status: "unchanged",
        matchIndex: bestMatch.index,
      };
    } else {
      // Mesma imagem, posição diferente = moved
      return {
        status: "moved",
        matchIndex: bestMatch.index,
      };
    }
  }

  // 2. Imagem similar mas com mudanças?
  if (bestMatch.distance <= CHANGED_THRESHOLD) {
    return {
      status: "changed",
      matchIndex: bestMatch.index,
    };
  }

  // 3. Nenhuma correspondência significativa = nova
  return {
    status: "new",
    matchIndex: null,
  };
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

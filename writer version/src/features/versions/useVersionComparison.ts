import {
  useState,
} from 'react'

import type {
  ChapterVersion,
} from '../../domain/models'

export function useVersionComparison(
  versions: ChapterVersion[],
  chapterId:
    | string
    | null,
) {
  /**
   * Guardamos únicamente las selecciones explícitas
   * del usuario.
   *
   * Si dejan de ser válidas porque cambia el capítulo,
   * simplemente derivamos valores válidos durante render.
   */
  const [
    requestedLeftVersionId,
    setRequestedLeftVersionId,
  ] =
    useState<
      string | null
    >(null)

  const [
    requestedRightVersionId,
    setRequestedRightVersionId,
  ] =
    useState<
      string | null
    >(null)

  /**
   * En vez de resetear isComparing mediante useEffect,
   * recordamos para qué capítulo se abrió la comparación.
   *
   * Si cambia chapterId, isComparing pasa automáticamente
   * a false sin necesitar otro render.
   */
  const [
    comparingChapterId,
    setComparingChapterId,
  ] =
    useState<
      string | null
    >(null)

  const requestedLeftExists =
    versions.some(
      (version) =>
        version.id ===
        requestedLeftVersionId,
    )

  const requestedRightExists =
    versions.some(
      (version) =>
        version.id ===
        requestedRightVersionId,
    )

  /**
   * versions está ordenado:
   *
   * reciente → antiguo
   *
   * Si no existe una selección válida:
   *
   * izquierda = versión más antigua
   * derecha   = versión más reciente
   */
  const defaultLeftVersionId =
    versions.length >= 2
      ? versions[
          versions.length - 1
        ].id
      : null

  const defaultRightVersionId =
    versions.length >= 2
      ? versions[0].id
      : null

  const leftVersionId =
    requestedLeftExists
      ? requestedLeftVersionId
      : defaultLeftVersionId

  const rightVersionId =
    requestedRightExists
      ? requestedRightVersionId
      : defaultRightVersionId

  const leftVersion =
    versions.find(
      (version) =>
        version.id ===
        leftVersionId,
    ) ?? null

  const rightVersion =
    versions.find(
      (version) =>
        version.id ===
        rightVersionId,
    ) ?? null

  const canCompare =
    Boolean(
      chapterId &&
        leftVersion &&
        rightVersion &&
        leftVersion.id !==
          rightVersion.id,
    )

  const isComparing =
    canCompare &&
    comparingChapterId ===
      chapterId

  function setLeftVersionId(
    versionId: string,
  ) {
    setRequestedLeftVersionId(
      versionId,
    )
  }

  function setRightVersionId(
    versionId: string,
  ) {
    setRequestedRightVersionId(
      versionId,
    )
  }

  function startComparison() {
    if (
      !chapterId ||
      !canCompare
    ) {
      return
    }

    setComparingChapterId(
      chapterId,
    )
  }

  function closeComparison() {
    setComparingChapterId(null)
  }

  return {
    isComparing,
    canCompare,

    leftVersionId,
    rightVersionId,

    leftVersion,
    rightVersion,

    setLeftVersionId,
    setRightVersionId,

    startComparison,
    closeComparison,
  }
}
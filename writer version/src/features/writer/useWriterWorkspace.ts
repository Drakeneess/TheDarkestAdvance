import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  chapterVersions,
  chapters,
  stories,
} from '../../data/database'

import {
  useSignalDB,
} from '../../data/reactivity'

import type {
  Chapter,
  ChapterVersion,
  Story,
} from '../../domain/models'

import {
  createChapter,
  createStory,
  restoreVersionToDraft,
  saveChapterDraft,
  saveChapterVersion,
} from '../library/library.service'

import {
  deleteChapterVersion,
  duplicateChapterVersion,
  renameChapterVersion,
} from '../versions/versions.service'

import {
  deleteChapter,
  duplicateChapter,
  moveChapter,
  renameChapter,
  reorderChapter
} from '../chapters/chapters.service'

import {
  deleteStory,
  duplicateStory,
  renameStory,
} from '../stories/stories.service'

import {
  exportStoryFile,
} from '../stories/story-transfer.service'

import {
  getActiveEntity,
  isActive,
} from '../../domain/sync-metadata'

export type DraftStatus =
  | 'saved'
  | 'pending'

const LAST_STORY_KEY =
  'writer:last-story'

const LAST_CHAPTER_KEY =
  'writer:last-chapter'

/**
 * Recupera el contenido de trabajo de un capítulo.
 *
 * Los capítulos antiguos pueden no tener draftContent,
 * por lo que usamos su currentVersion como fallback.
 */
function readChapterDraft(
  chapter: Chapter,
) {
  if (
    typeof chapter.draftContent ===
    'string'
  ) {
    return chapter.draftContent
  }

  if (!chapter.currentVersionId) {
    return ''
  }

  const currentVersion =
    getActiveEntity(
      chapterVersions.findOne(
        {
          id:
            chapter.currentVersionId,
        },
        {
          reactive: false,
        },
      ),
    )

  return (
    currentVersion?.content ??
    ''
  )
}

/**
 * Recupera la última posición conocida del editor.
 *
 * App.tsx espera databaseReady antes de montar
 * WriterWorkspace, así que SignalDB ya puede consultarse
 * cuando este initializer se ejecuta.
 */
function loadInitialWorkspace() {
  const storedStoryId =
    localStorage.getItem(
      LAST_STORY_KEY,
    )

  if (!storedStoryId) {
    return {
      storyId: null,
      chapterId: null,
      draft: '',
    }
  }

  const story =
    getActiveEntity(
      stories.findOne(
        {
          id:
            storedStoryId,
        },
        {
          reactive: false,
        },
      ),
    )

  /**
   * La historia pudo haber sido eliminada.
   */
  if (!story) {
    return {
      storyId: null,
      chapterId: null,
      draft: '',
    }
  }

  const storedChapterId =
    localStorage.getItem(
      LAST_CHAPTER_KEY,
    )

  if (!storedChapterId) {
    return {
      storyId:
        story.id,

      chapterId:
        null,

      draft: '',
    }
  }

  const chapter =
    getActiveEntity(
      chapters.findOne(
        {
          id:
            storedChapterId,

          storyId:
            story.id,
        },
        {
          reactive: false,
        },
      ),
    )

  /**
   * El capítulo pudo haber sido eliminado,
   * pero la historia sigue siendo válida.
   */
  if (!chapter) {
    return {
      storyId:
        story.id,

      chapterId:
        null,

      draft: '',
    }
  }

  return {
    storyId:
      story.id,

    chapterId:
      chapter.id,

    draft:
      readChapterDraft(
        chapter,
      ),
  }
}

/**
 * Sincroniza la posición del usuario con localStorage.
 *
 * Esto NO almacena el borrador.
 * El borrador sigue viviendo en SignalDB / IndexedDB.
 */
function rememberWorkspace(
  storyId:
    | string
    | null,

  chapterId:
    | string
    | null,
) {
  if (storyId) {
    localStorage.setItem(
      LAST_STORY_KEY,
      storyId,
    )
  } else {
    localStorage.removeItem(
      LAST_STORY_KEY,
    )
  }

  if (chapterId) {
    localStorage.setItem(
      LAST_CHAPTER_KEY,
      chapterId,
    )
  } else {
    localStorage.removeItem(
      LAST_CHAPTER_KEY,
    )
  }
}

export function useWriterWorkspace() {
  /**
   * Restauramos la posición una sola vez
   * durante la creación del hook.
   */
  const [
    initialWorkspace,
  ] = useState(
    loadInitialWorkspace,
  )

  /* -------------------------------------------------- */
  /* Reactive collections                               */
  /* -------------------------------------------------- */

  const storyList =
    useSignalDB(() =>
      stories
        .find(
          {},
          {
            sort: {
              updatedAt: -1,
            },
          },
        )
        .fetch()
        .filter(
          isActive,
        ),
    )

  /**
   * Todos los capítulos.
   *
   * Se utiliza para la búsqueda global,
   * independientemente de qué historia esté abierta.
   */
  const allChapters =
    useSignalDB(() =>
      chapters
        .find(
          {},
          {
            sort: {
              updatedAt: -1,
            },
          },
        )
        .fetch()
        .filter(
          isActive,
        ),
    )

  /* -------------------------------------------------- */
  /* Selection state                                    */
  /* -------------------------------------------------- */

  const [
    selectedStoryId,
    setSelectedStoryId,
  ] =
    useState<
      string | null
    >(
      initialWorkspace.storyId,
    )

  const [
    selectedChapterId,
    setSelectedChapterId,
  ] =
    useState<
      string | null
    >(
      initialWorkspace.chapterId,
    )

  const [
    selectedVersionId,
    setSelectedVersionId,
  ] =
    useState<
      string | null
    >(null)

  /* -------------------------------------------------- */
  /* Form state                                         */
  /* -------------------------------------------------- */

  const [
    newStoryTitle,
    setNewStoryTitle,
  ] = useState('')

  const [
    newChapterTitle,
    setNewChapterTitle,
  ] = useState('')

  const [
    versionLabel,
    setVersionLabel,
  ] = useState('')

  /* -------------------------------------------------- */
  /* Draft                                              */
  /* -------------------------------------------------- */

  const [
    draft,
    setDraft,
  ] =
    useState(
      initialWorkspace.draft,
    )

  const [
    draftStatus,
    setDraftStatus,
  ] =
    useState<DraftStatus>(
      'saved',
    )

  const lastSavedDraftRef =
    useRef(
      initialWorkspace.draft,
    )

  /* -------------------------------------------------- */
  /* Current story                                      */
  /* -------------------------------------------------- */

  const selectedStory =
    useMemo(
      () =>
        storyList.find(
          (story) =>
            story.id ===
            selectedStoryId,
        ) ?? null,
      [
        storyList,
        selectedStoryId,
      ],
    )

  /* -------------------------------------------------- */
  /* Current story chapters                             */
  /* -------------------------------------------------- */

  const chapterList =
    useSignalDB(
      () =>
        selectedStoryId
          ? chapters
              .find(
                {
                  storyId:
                    selectedStoryId,
                },
                {
                  sort: {
                    order: 1,
                  },
                },
              )
              .fetch()
              .filter(
                isActive,
              )
          : [],
      [selectedStoryId],
    )

  const selectedChapter =
    useMemo(
      () =>
        chapterList.find(
          (chapter) =>
            chapter.id ===
            selectedChapterId,
        ) ?? null,
      [
        chapterList,
        selectedChapterId,
      ],
    )

  /* -------------------------------------------------- */
  /* Versions                                           */
  /* -------------------------------------------------- */

  const versions =
    useSignalDB(
      () =>
        selectedChapterId
          ? chapterVersions
              .find(
                {
                  chapterId:
                    selectedChapterId,
                },
                {
                  sort: {
                    createdAt: -1,
                  },
                },
              )
              .fetch()
              .filter(
                isActive,
              )
          : [],
      [selectedChapterId],
    )

  const selectedVersion =
    useMemo(
      () =>
        versions.find(
          (version) =>
            version.id ===
            selectedVersionId,
        ) ?? null,
      [
        versions,
        selectedVersionId,
      ],
    )

  /* -------------------------------------------------- */
  /* Quick chapter navigation                           */
  /* -------------------------------------------------- */

  const selectedChapterIndex =
    chapterList.findIndex(
      (chapter) =>
        chapter.id ===
        selectedChapterId,
    )

  const previousChapter =
    selectedChapterIndex > 0
      ? chapterList[
          selectedChapterIndex - 1
        ]
      : null

  const nextChapter =
    selectedChapterIndex >= 0 &&
    selectedChapterIndex <
      chapterList.length - 1
      ? chapterList[
          selectedChapterIndex + 1
        ]
      : null

  /* -------------------------------------------------- */
  /* Remember current workspace                         */
  /* -------------------------------------------------- */

  /**
   * localStorage sí es un sistema externo a React,
   * por lo que sincronizarlo mediante effect es apropiado.
   */
  useEffect(() => {
    rememberWorkspace(
      selectedStoryId,
      selectedChapterId,
    )
  }, [
    selectedStoryId,
    selectedChapterId,
  ])

  /* -------------------------------------------------- */
  /* Draft persistence                                  */
  /* -------------------------------------------------- */

  function persistDraftNow() {
    if (
      !selectedChapterId ||
      !selectedStoryId ||
      selectedVersionId
    ) {
      return
    }

    if (
      draft ===
      lastSavedDraftRef.current
    ) {
      return
    }

    saveChapterDraft(
      selectedChapterId,
      selectedStoryId,
      draft,
    )

    lastSavedDraftRef.current =
      draft

    setDraftStatus(
      'saved',
    )
  }

  /**
   * Autosave con debounce.
   *
   * handleDraftChange cambia inmediatamente
   * el estado a "pending".
   *
   * Este effect solo programa la persistencia.
   */
  useEffect(() => {
    if (
      !selectedChapterId ||
      !selectedStoryId ||
      selectedVersionId
    ) {
      return
    }

    if (
      draft ===
      lastSavedDraftRef.current
    ) {
      return
    }

    const timeout =
      window.setTimeout(
        () => {
          saveChapterDraft(
            selectedChapterId,
            selectedStoryId,
            draft,
          )

          lastSavedDraftRef.current =
            draft

          setDraftStatus(
            'saved',
          )
        },
        700,
      )

    return () => {
      window.clearTimeout(
        timeout,
      )
    }
  }, [
    draft,
    selectedChapterId,
    selectedStoryId,
    selectedVersionId,
  ])

  /**
   * Punto único para modificaciones realizadas
   * desde el textarea.
   */
  function handleDraftChange(
    value: string,
  ) {
    setDraft(value)

    if (
      !selectedVersionId &&
      selectedChapterId &&
      selectedStoryId
    ) {
      setDraftStatus(
        value ===
          lastSavedDraftRef.current
          ? 'saved'
          : 'pending',
      )
    }
  }

  /* -------------------------------------------------- */
  /* Selection                                          */
  /* -------------------------------------------------- */

  function handleSelectStory(
    storyId: string,
  ) {
    persistDraftNow()

    setSelectedStoryId(
      storyId,
    )

    setSelectedChapterId(
      null,
    )

    setSelectedVersionId(
      null,
    )

    setDraft('')

    lastSavedDraftRef.current =
      ''

    setDraftStatus(
      'saved',
    )
  }

  /**
   * También cambia selectedStoryId.
   *
   * Esto permite seleccionar desde la búsqueda
   * un capítulo perteneciente a otra historia.
   */
  function handleSelectChapter(
    chapter: Chapter,
  ) {
    persistDraftNow()

    const content =
      readChapterDraft(
        chapter,
      )

    setSelectedStoryId(
      chapter.storyId,
    )

    setSelectedChapterId(
      chapter.id,
    )

    setSelectedVersionId(
      null,
    )

    setDraft(content)

    lastSavedDraftRef.current =
      content

    setDraftStatus(
      'saved',
    )
  }

  function handleSelectVersion(
    version: ChapterVersion,
  ) {
    persistDraftNow()

    setSelectedVersionId(
      version.id,
    )
  }

  function handleReturnToDraft() {
    setSelectedVersionId(
      null,
    )
  }

  /* -------------------------------------------------- */
  /* Quick navigation                                   */
  /* -------------------------------------------------- */

  function handlePreviousChapter() {
    if (!previousChapter) {
      return
    }

    handleSelectChapter(
      previousChapter,
    )
  }

  function handleNextChapter() {
    if (!nextChapter) {
      return
    }

    handleSelectChapter(
      nextChapter,
    )
  }

  /* -------------------------------------------------- */
  /* Create                                             */
  /* -------------------------------------------------- */

  function handleCreateStory() {
    const title =
      newStoryTitle.trim()

    if (!title) {
      return
    }

    persistDraftNow()

    const story =
      createStory(
        title,
      )

    setNewStoryTitle('')

    setSelectedStoryId(
      story.id,
    )

    setSelectedChapterId(
      null,
    )

    setSelectedVersionId(
      null,
    )

    setDraft('')

    lastSavedDraftRef.current =
      ''

    setDraftStatus(
      'saved',
    )
  }

  function handleCreateChapter() {
    if (
      !selectedStoryId ||
      !newChapterTitle.trim()
    ) {
      return
    }

    persistDraftNow()

    const chapter =
      createChapter(
        selectedStoryId,
        newChapterTitle,
      )

    setNewChapterTitle('')

    const content =
      readChapterDraft(
        chapter,
      )

    setSelectedChapterId(
      chapter.id,
    )

    setSelectedVersionId(
      null,
    )

    setDraft(content)

    lastSavedDraftRef.current =
      content

    setDraftStatus(
      'saved',
    )
  }

  /* -------------------------------------------------- */
  /* Versions                                           */
  /* -------------------------------------------------- */

  function handleSaveVersion() {
    if (!selectedChapter) {
      return
    }

    const label =
      versionLabel.trim() ||
      `v${versions.length + 1}`

    saveChapterVersion(
      selectedChapter,
      draft,
      label,
    )

    lastSavedDraftRef.current =
      draft

    setVersionLabel('')

    setDraftStatus(
      'saved',
    )

    setSelectedVersionId(
      null,
    )
  }

  function handleRestoreVersion() {
    if (
      !selectedChapter ||
      !selectedVersion
    ) {
      return
    }

    restoreVersionToDraft(
      selectedChapter,
      selectedVersion,
    )

    setDraft(
      selectedVersion.content,
    )

    lastSavedDraftRef.current =
      selectedVersion.content

    setSelectedVersionId(
      null,
    )

    setDraftStatus(
      'saved',
    )
  }

  function handleRenameVersion(
    version: ChapterVersion,
    label: string,
  ) {
    if (!selectedChapter) {
      return
    }

    renameChapterVersion(
      selectedChapter,
      version,
      label,
    )
  }

  function handleDuplicateVersion(
    version: ChapterVersion,
  ) {
    if (!selectedChapter) {
      return
    }

    duplicateChapterVersion(
      selectedChapter,
      version,
    )
  }

  function handleDeleteVersion(
    version: ChapterVersion,
  ) {
    if (!selectedChapter) {
      return
    }

    /**
     * Si estamos visualizando justamente
     * la versión eliminada, regresamos al draft.
     */
    if (
      selectedVersionId ===
      version.id
    ) {
      setSelectedVersionId(
        null,
      )
    }

    deleteChapterVersion(
      selectedChapter,
      version,
    )
  }

  /* -------------------------------------------------- */
  /* Chapters                                           */
  /* -------------------------------------------------- */

  function handleRenameChapter(
    chapter: Chapter,
    title: string,
  ) {
    renameChapter(
      chapter,
      title,
    )
  }

  function handleMoveChapter(
    chapter: Chapter,
    direction:
      | 'up'
      | 'down',
  ) {
    moveChapter(
      chapter,
      direction,
    )
  }

  function handleReorderChapter(
    chapterId: string,
    targetChapterId: string,
  ) {
    reorderChapter(
      chapterId,
      targetChapterId,
    )
  }

  function handleDuplicateChapter(
    chapter: Chapter,
  ) {
    /**
     * Si duplicamos el capítulo activo,
     * guardamos primero hasta la última letra.
     */
    if (
      selectedChapterId ===
      chapter.id
    ) {
      persistDraftNow()
    }

    const duplicated =
      duplicateChapter(
        chapter,
      )

    const content =
      duplicated.draftContent ??
      ''

    setSelectedStoryId(
      duplicated.storyId,
    )

    setSelectedChapterId(
      duplicated.id,
    )

    setSelectedVersionId(
      null,
    )

    setDraft(content)

    lastSavedDraftRef.current =
      content

    setDraftStatus(
      'saved',
    )
  }

  function handleDeleteChapter(
    chapter: Chapter,
  ) {
    const deletingSelected =
      selectedChapterId ===
      chapter.id

    deleteChapter(
      chapter,
    )

    if (!deletingSelected) {
      return
    }

    setSelectedChapterId(
      null,
    )

    setSelectedVersionId(
      null,
    )

    setDraft('')

    lastSavedDraftRef.current =
      ''

    setDraftStatus(
      'saved',
    )
  }

  /* -------------------------------------------------- */
  /* Stories                                            */
  /* -------------------------------------------------- */

  function handleRenameStory(
    story: Story,
    title: string,
  ) {
    renameStory(
      story,
      title,
    )
  }

  function handleDuplicateStory(
    story: Story,
  ) {
    /**
     * La historia puede contener el capítulo
     * actualmente editado.
     */
    if (
      selectedStoryId ===
      story.id
    ) {
      persistDraftNow()
    }

    const duplicated =
      duplicateStory(
        story,
      )

    setSelectedStoryId(
      duplicated.id,
    )

    setSelectedChapterId(
      null,
    )

    setSelectedVersionId(
      null,
    )

    setDraft('')

    lastSavedDraftRef.current =
      ''

    setDraftStatus(
      'saved',
    )
  }

  function handleDeleteStory(
    story: Story,
  ) {
    const deletingSelected =
      selectedStoryId ===
      story.id

    deleteStory(
      story,
    )

    if (!deletingSelected) {
      return
    }

    setSelectedStoryId(
      null,
    )

    setSelectedChapterId(
      null,
    )

    setSelectedVersionId(
      null,
    )

    setDraft('')

    lastSavedDraftRef.current =
      ''

    setDraftStatus(
      'saved',
    )
  }

  /* -------------------------------------------------- */
  /* Import / export                                    */
  /* -------------------------------------------------- */

  function handleExportStory(
    story: Story,
  ) {
    /**
     * Antes de exportar la historia abierta,
     * persistimos cualquier cambio pendiente.
     */
    if (
      selectedStoryId ===
      story.id
    ) {
      persistDraftNow()
    }

    exportStoryFile(
      story,
    )
  }

  function handleImportedStory(
    story: Story,
  ) {
    setSelectedStoryId(
      story.id,
    )

    setSelectedChapterId(
      null,
    )

    setSelectedVersionId(
      null,
    )

    setDraft('')

    lastSavedDraftRef.current =
      ''

    setDraftStatus(
      'saved',
    )
  }

  /* -------------------------------------------------- */
  /* Editor derived values                              */
  /* -------------------------------------------------- */

  const visibleContent =
    selectedVersion
      ? selectedVersion.content
      : draft

  const wordCount =
    visibleContent
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length

  return {
    /* Collections */

    storyList,
    chapterList,
    allChapters,
    versions,

    /* Current entities */

    selectedStory,
    selectedChapter,
    selectedVersion,

    /* Selection IDs */

    selectedStoryId,
    selectedChapterId,
    selectedVersionId,

    /* Quick navigation */

    previousChapter,
    nextChapter,

    /* Forms */

    newStoryTitle,
    newChapterTitle,
    versionLabel,

    /* Editor */

    draft,
    draftStatus,
    visibleContent,
    wordCount,

    /* Simple setters */

    setNewStoryTitle,
    setNewChapterTitle,
    setVersionLabel,

    /**
     * Dejamos setDraft disponible por compatibilidad,
     * pero EditorPanel debería usar handleDraftChange.
     */
    setDraft,

    /* Selection */

    handleSelectStory,
    handleSelectChapter,
    handleSelectVersion,
    handleReturnToDraft,

    /* Quick navigation */

    handlePreviousChapter,
    handleNextChapter,

    /* Draft */

    handleDraftChange,
    persistDraftNow,

    /* Creation */

    handleCreateStory,
    handleCreateChapter,

    /* Versions */

    handleSaveVersion,
    handleRestoreVersion,

    handleRenameVersion,
    handleDuplicateVersion,
    handleDeleteVersion,

    /* Chapters */

    handleRenameChapter,
    handleMoveChapter,
    handleReorderChapter,
    handleDuplicateChapter,
    handleDeleteChapter,

    /* Stories */

    handleRenameStory,
    handleDuplicateStory,
    handleDeleteStory,

    /* Transfer */

    handleExportStory,
    handleImportedStory,
  }
}
import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    ggMarks: {
      toggleSpeech:  () => ReturnType
      toggleThought: () => ReturnType
      toggleWhisper: () => ReturnType
      toggleShout:   () => ReturnType
    }
  }
}

function makeMark(name: string, cls: string, command: string) {
  return Mark.create({
    name,
    parseHTML() {
      return [{ tag: `span.${cls}` }]
    },
    renderHTML({ HTMLAttributes }) {
      return ['span', mergeAttributes(HTMLAttributes, { class: cls }), 0]
    },
    addCommands() {
      return {
        [command]: () => ({ commands }: { commands: Record<string, (n: string) => boolean> }) =>
          commands.toggleMark(name),
      } as never
    },
  })
}

export const Speech  = makeMark('speech',  'gg-speech',  'toggleSpeech')
export const Thought = makeMark('thought', 'gg-thought', 'toggleThought')
export const Whisper = makeMark('whisper', 'gg-whisper', 'toggleWhisper')
export const Shout   = makeMark('shout',   'gg-shout',   'toggleShout')
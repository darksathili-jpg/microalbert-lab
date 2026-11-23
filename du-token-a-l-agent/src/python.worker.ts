import type { loadPyodide } from 'pyodide'
self.addEventListener(
  'message',
  async (event: MessageEvent<{ code: string; indexURL: string }>) => {
    let stdout = '',
      stderr = '',
      truncated = false
    const limit = 6000
    const append = (current: string, text: string) => {
      if (current.length + text.length + 1 > limit) truncated = true
      return (current + text + '\n').slice(0, limit)
    }
    try {
      const { code, indexURL } = event.data
      const { loadPyodide: load } = (await import(
        /* @vite-ignore */ indexURL + 'pyodide.mjs'
      )) as { loadPyodide: typeof loadPyodide }
      const py = await load({ indexURL })
      self.postMessage({ ready: true })
      py.setStdout({
        batched: (text) => {
          stdout = append(stdout, text)
        },
      })
      py.setStderr({
        batched: (text) => {
          stderr = append(stderr, text)
        },
      })
      const namespace = py.toPy({})
      try {
        await py.runPythonAsync(code, { globals: namespace })
      } finally {
        namespace.destroy()
      }
      self.postMessage({ stdout, stderr, truncated })
    } catch (error) {
      self.postMessage({
        stdout,
        stderr,
        truncated,
        error: String(error).slice(0, limit),
      })
    }
  },
  { once: true },
)

// Session replay / heatmap vendor: snapshots the page on every click
(function () {
  function compress(input) {
    let out = 0
    for (let i = 0; i < input.length; i++)
      out = (out * 31 + input.charCodeAt(i)) | 0
    return out
  }

  document.addEventListener('click', (event) => {
    let snapshot = document.documentElement.outerHTML
    let end = performance.now() + 300
    let checksum = 0
    while (performance.now() < end)
      checksum ^= compress(snapshot.slice(0, 20000))
    window.__heatmap = { x: event.clientX, y: event.clientY, checksum }
  }, true)
})()

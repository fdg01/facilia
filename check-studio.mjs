// Check what the home page actually renders
const resp = await fetch("http://localhost:3000/")
const html = await resp.text()
// Find all script srcs
const scripts = html.match(/src="([^"]+\.js)"/g)
console.log("Scripts:", scripts ? scripts.length : 0)
// Look for the page content
const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)
if (bodyMatch) {
  console.log("Body length:", bodyMatch[1].length)
  console.log("Body preview:", bodyMatch[1].substring(0, 1000))
}

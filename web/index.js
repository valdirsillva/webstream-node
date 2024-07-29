const API_URL = 'http://localhost:3000'

async function consumeAPI(signal) {
    const response = await fetch(API_URL, {
        signal
    })
    let counter = 0
    const reader = response.body
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(parseNdJSON())
    // .pipeTo(new WritableStream({
    //     write(chunk) {
    //         console.log(++counter, 'chunk', chunk)
    //     }
    // }))

    return reader
}

function appendToHTML(element) {
    return new WritableStream({
        write({ title, description, url_anime }) {
            const card = `
             <article>
                <div class="text">
                    <h3>${title}</h3>
                    <p>${description.slice(0, 100)}</p>
                    <a href="${url_anime}">Heres why</a>
                </div>
            </article>
            `
            element.innerHTML += card
        },

        abort(reason) {
            console.log('aborted**', reason)
        }
    })
}

// Essa  função vai se certificar que caso dois chunks cheguemem uma unica transmissao
// converta corretamente para JSON
function parseNdJSON() {
    let ndJsonBuffer = ''

    return new TransformStream({
        transform(chunk, controller) {
            ndJsonBuffer += chunk
            const items = ndJsonBuffer.split('\n')
            items.slice(0, -1).forEach(item => controller.enqueue(JSON.parse(item)))
            ndJsonBuffer = items[items.length - 1]
        },
        flush(controller) {
            if (!ndJsonBuffer) return
            controller.enqueue(JSON.parse(ndJsonBuffer))
        }
    })
}
const [start, stop, cards] = ['start', 'stop', 'cards'].map(item => document.getElementById(item))

let abortController = new AbortController()
start.addEventListener('click', async () => {
    const readable = await consumeAPI(abortController.signal)
    readable.pipeTo(appendToHTML(cards))
})

stop.addEventListener('click', () => {
    abortController.abort()
    console.log('aborting...')
    abortController = new AbortController()
})


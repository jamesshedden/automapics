const fetch = require('node-fetch')

const id = Date.now().toString()

const headers = {
    'Authorization': `token ${process.env.GITHUB_TOKEN}`
}

const GITHUB_API_URL = 'https://api.github.com'
const OWNER = 'jamesshedden'
const REPO = 'automapics'

async function getHeadReference() {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/refs/heads/master`
    ).then((response) => {
        return response.json()
    }).then((data) => {
        const { sha, url } = data.object
        return { sha, url }
    })
}

async function getCommit(url) {
    return fetch(url).then(response => response.json()).then((data) => {
        const {
            sha,
            tree: {
                sha: treeSha,
                url: treeUrl,
            }
        } = data

        return { sha, treeSha, treeUrl }
    })
}

async function createImageBlob(base64Image) {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/blobs`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify({
                content: base64Image,
                encoding: "base64",
            })
        }
    ).then(response => response.json()).then((data) => {
        return { sha: data.sha }
    })
}

async function createJSONBlob(content) {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/blobs`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify({
                content: JSON.stringify(content),
                encoding: "utf-8",
            })
        }
    ).then(response => response.json()).then((data) => {
        return { sha: data.sha }
    })
}

async function createTree(baseTree, tree) {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/trees`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify({
                base_tree: baseTree,
                tree,
            })
        }
    ).then(response => response.json()).then(data => {
        return { sha: data.sha }
    })
}

async function createCommit(body) {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/commits`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify(body),
        }
    ).then(response => response.json()).then(data => {
        return { sha: data.sha }
    })
}

async function createBranch(shaToBranchFrom) {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/refs`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify({
                ref: `refs/heads/new-image-${id}`,
                sha: shaToBranchFrom
            })
        }
    ).then(response => response.json()).then(data => {
        return { ref: data.ref }
    })
}

async function updateReference(body, refs) {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/${refs}`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify(body)
        }
    ).then(response => response.json()).then(data => data.ref)
}

async function createPullRequest(body) {
    fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/pulls`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify(body)
        }
    )
}

async function submitImageToGitHub(req, res) {
    const headReference = await getHeadReference()
    const branch = await createBranch(headReference.sha)
    const commit = await getCommit(headReference.url)

    const imageBlob = await createImageBlob(req.body.image)
    const date = new Date

    const JSONBlob = await createJSONBlob({
        filename: `${id}.png`,
        created_at: date.toUTCString(),
    })

    const tree = await createTree(
        commit.treeSha,
        [
            {
                path: `img/${id}.png`,
                mode: '100644',
                type: 'blob',
                sha: imageBlob.sha
            },
            {
                path: `posts/${id}.json`,
                mode: '100644',
                type: 'blob',
                sha: JSONBlob.sha
            }
        ]
    )

    const newCommit = await createCommit({
        message: `Add ${id}`,
        parents: [headReference.sha],
        tree: tree.sha,
    })

    const newReference = await updateReference({ sha: newCommit.sha }, branch.ref)

    createPullRequest({
        title: `Add ${id}`,
        head: newReference.replace('refs/heads/', ''),
        base: 'master',
    }).then(() => res.send('PR created'))

}

module.exports = submitImageToGitHub;
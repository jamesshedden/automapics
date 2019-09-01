let foo = 'bar'

let saveButton = document.getElementById('save-image');

const id = Date.now().toString()

const headers = {
    'Authorization': 'token 063f89358bbf352a3f16d6675a345c846a15f30e'
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

async function createBlob() {
    return fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/git/blobs`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify({
                content: "Content of the blob",
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

function createPullRequest(body) {
    fetch(
        `${GITHUB_API_URL}/repos/${OWNER}/${REPO}/pulls`,
        {
            method: 'post',
            headers: headers,
            body: JSON.stringify(body)
        }
    )
}

async function submitImageToGitHub() {
    const headReference = await getHeadReference()
    const branch = await createBranch(headReference.sha)
    const commit = await getCommit(headReference.url)

    const blob = await createBlob()

    const tree = await createTree(
        commit.treeSha,
        [{
            path: `${id}.txt`,
            mode: '100644',
            type: 'blob',
            sha: blob.sha
        }]
    )

    const newCommit = await createCommit({
        message: "Test commit",
        parents: [headReference.sha],
        tree: tree.sha,
    })

    const newReference = await updateReference({ sha: newCommit.sha }, branch.ref)

    createPullRequest({
        title: `Add image ${id}`,
        head: newReference.replace('refs/heads/', ''),
        base: 'master',
    })

}

saveButton.addEventListener('click', submitImageToGitHub)
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'searchMastodon') {
        // Load saved settings from localStorage
        const mastodonDomain = localStorage.getItem('domain');
        const apiKey = localStorage.getItem('apiKey');
        const numPosts = localStorage.getItem('numPosts') || 5;
        const searchTerm = message.searchTerm;


        fetch(`https://${mastodonDomain}/api/v2/search?q=${encodeURIComponent(searchTerm)}&resolve=true&limit=${numPosts}`, {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        })
        .then(response => response.json())
        .then(data => {
            sendResponse({ success: true, results: data.statuses });
        })
        .catch(error => {
            sendResponse({ success: false, error: error.message });
        });

        return true;
    }
	else if (message.action === 'getSettings') {
        const domain = localStorage.getItem('domain');
        const numPosts = parseInt(localStorage.getItem('numPosts'));
        sendResponse({ domain, numPosts });
    }
});

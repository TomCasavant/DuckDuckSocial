// Extract the search term from DuckDuckGo's URL
const urlParams = new URLSearchParams(window.location.search);
const searchTerm = urlParams.get('q');

if (searchTerm) {
    // Request the settings from the background script
    browser.runtime.sendMessage({ action: 'getSettings' })
        .then(settings => {
            const mastodonDomain = settings.domain;
            const numPosts = settings.numPosts;


            browser.runtime.sendMessage({ action: 'searchMastodon', searchTerm: searchTerm })
                .then(response => {
                    if (response.success) {
                        const results = response.results;

                        var div = document.createElement('div');
                        div.className = 'duckducksocial-results'; 

                        results.slice(0, numPosts).forEach(function(post) {
                            var postDiv = document.createElement('div');
                            postDiv.className = 'duckducksocial-post'; 

                            var username = document.createElement('p');
                            username.textContent = `@${post.account.acct}`;
                            username.className = 'duckducksocial-username'; 


							var sanitizedContent = DOMPurify.sanitize(post.content);
                            var content = document.createElement('p');
							content.innerHTML = post.content;
							content.className = 'duckducksocial-content';


                            // Datetime
                            var datetime = document.createElement('p');
                            datetime.textContent = new Date(post.created_at).toLocaleString();
                            datetime.className = 'duckducksocial-datetime'; 

                            var postHref = document.createElement('a');
                            postHref.href = `https://${mastodonDomain}/@${post.account.acct}/${post.id}`;
                            postHref.appendChild(postDiv);

                            postDiv.appendChild(username);
                            postDiv.appendChild(content);
                            postDiv.appendChild(datetime);

                            div.appendChild(postHref);
                        });

                        // Insert the container div into the document
                        var layout = document.getElementById('react-layout');
                        layout.insertBefore(div, layout.firstChild);
                    } else {
                        console.error('Failed to retrieve search results:', response.error);
                    }
                });
        })
        .catch(error => {
            console.error('Failed to retrieve settings:', error);
        });
}


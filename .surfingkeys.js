//////////////////////////////////////
// Settings

Hints.characters = "arstneio";
settings.smoothScroll = false;

// END Settings
//////////////////////////////////////

//////////////////////////////////////
// Colemak bindings

// normal mode

// save the originals into an alias so there will be no dependency or order
// issue
map('_h',  'h');
map('_j',  'j');
map('_k',  'k');
map('_l',  'l');
map('_n',  'n');
map('_N',  'N');
map('_R',  'R');
map('_af', 'af');
map('_v',  'v');
map('_V',  'V');
map('_yt', 'yt');
map('_yy', 'yy');
map('_yl', 'yl');
map('_yf', 'yf');
map('_S',  'S');
map('_D',  'D');

// remove the one we backed up
unmap('h');
unmap('j');
unmap('k');
unmap('l');
unmap('n');
unmap('N');
unmap('R');
unmap('af');
unmap('v');
unmap('V');
unmap('yt');
unmap('yy');
unmap('yl');
unmap('yf');
unmap('S');
unmap('D');

// map the Colemak bindings
map('n',  '_h');  // scroll left
map('e',  '_j');  // scroll down
map('i',  '_k');  // scroll up
map('o',  '_l');  // scroll right
map('k',  '_n');  // find next
map('K',  '_N');  // find previous
map('I',  '_R');  // go one tab right
map('F',  '_af'); // open hint in a new tab
map('a',  '_v');  // Toggle visual mode
map('A',  '_V');  // Restore visual mode
map('ct', '_yt'); // duplicate current page
map('cc', '_yy'); // copy current page URL
map('cl', '_yl'); // copy current page's title
map('cf', '_yf'); // copy form data in JSON on current page
map('N',  '_S');  // go back in history
map('O',  '_D');  // go forward in history

// finally remove what we have saved
unmap('_h');
unmap('_j');
unmap('_k');
unmap('_l');
unmap('_n');
unmap('_N');
unmap('_R');
unmap('_af');
unmap('_v');
unmap('_V');
unmap('_yt');
unmap('_yy');
unmap('_yl');
unmap('_yf');
unmap('_S');
unmap('_D');

// visual mode

// save the originals into an alias so there will be no dependency or order
// issue
vmap('_h',  'h');
vmap('_j',  'j');
vmap('_k',  'k');
vmap('_l',  'l');

// remove the one we backed up
vunmap('h');
vunmap('j');
vunmap('k');
vunmap('l');

// map the Colemak bindings
vmap('n',  '_h');  // backward character
vmap('e',  '_j');  // forward line
vmap('i',  '_k');  // backward line
vmap('o',  '_l');  // forward character

// finally remove what we have saved
vunmap('_h');
vunmap('_j');
vunmap('_k');
vunmap('_l');

// END Colemak bindings
//////////////////////////////////////

//////////////////////////////////////
// Custom functions


function copyLastElementInPath() {
  var locationParts = window.location.href.split("/");
  var lastElement = locationParts[locationParts.length-1].split("#")[0].split("?")[0];
  Front.writeClipboard(lastElement);
  Front.showBanner("Copied " + lastElement + " to the clipboard.");
}

// openAlternate opens the alternate page:
// - When on Github viewing a PR, open the build for this PR                       (DONE)
// - When on Github viewing a source file, open the test file                      (DONE)
// - When on Github viewing a test file, open the source file                      (DONE)
// - When on Github viewing anything else, go the Travis repo                      (DONE)
// - When on Travis viewing a build for a PR, go to Github PR                      (DONE)
// - When on Travis viewing a build for branch, go to Github with branch selected  (TODO)
// - When on Travis viewing the main build, go to Github repo                      (DONE)
//
// openAlternate requires the username and the api_token in order to work.  The
// username and the api_token must be stored in the chrome storage. To set them
// in the storage, execute the following in the chrome console on Surfingkey's
// background page:
//   chrome.storage.sync.set({'github_api_username': '...'});
//   chrome.storage.sync.set({'github_api_token': '...'});
function openAlternate() {
  // start by splitting the path by slashes, ignoring the first slash to
  // prevent having the first element an empty string
  var pp = window.location.pathname.substring(1).split("/");

  // extract the anchor from the last element
  if (pp[pp.length - 1].indexOf("#") !== -1) {
    var tmp = pp[pp.length - 1].split("#");
    pp[pp.length - 1] = tmp[0];
    var anchor = tmp[1];
  }

  // extract any query params from the last element
  if (pp[pp.length - 1].indexOf("?") !== -1) {
    var tmp = pp[pp.length - 1].split("?");
    pp[pp.length - 1] = tmp[0];
    var query = tmp[1];
  }

  // isGithubPrivateRepo() returns true if the current page is a private repo
  function isGithubPrivateRepo() {
    return document.getElementsByClassName("label-private").length > 0;
  }

  // isGithubPR returns true if we are viewing a PR
  function isGithubPR() {
    return pp[2] === "pull";
  }

  // getGithubPullRequestURL() returns a promise that returns the URL of the PR (if
  // successful) or rejects it with a string error.
  function getGithubPullRequestURL(username, password) {
    return new Promise(function(resolve, reject) {
      // compute the XHR URL
      var api_pulls_url = "https://api.github.com/repos" + repoPath() + "/pulls";
      // find the branch name
      var commitBranches = window.document.getElementsByClassName("commit-branch");
      if (commitBranches.length === 1) {
        var commitBranch = commitBranches[0].title;
        // make an XHR Request to Github to find the URL
        var xhr = new XMLHttpRequest();
        xhr.open("GET", api_pulls_url, true);
        xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4) {
            if (xhr.status >= 200 && xhr.status < 299) {
              var pulls = JSON.parse(xhr.responseText);
              for (var i = 0; i < pulls.length; i++) {
                var pull = pulls[i];
                if (pull.head.ref === commitBranch) {
                  resolve(pull.html_url);
                  return;
                }
              }
              reject("did not find a pull request for branch " + commitBranch);
            } else {
              reject("got " + xhr.statusText + " in the HTTP request to " + api_pulls_url);
              return;
            }
          }
        }
        xhr.send();
      } else {
        console.log("found " + commitBranches.length + " elements with class commit-branch, was expecting only one");
        reject("");
      }
    });
  }

  // getTravisURL returns a promise that returns the URL of the Travis
  // push build (if successful) or rejects it with a string error.
  function getTravisURL(username, password) {
    return new Promise(function(resolve, reject) {
      var api_pull_url = "https://api.github.com/repos" + repoPath() + "/pulls/" + pp[3];
      // make an XHR Request to Github to find the URL
      var xhr = new XMLHttpRequest();
      xhr.open("GET", api_pull_url, true);
      xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 299) {
            var pr = JSON.parse(xhr.responseText);
            if (!pr || !pr._links || !pr._links.statuses || !pr._links.statuses.href) {
              reject("statuses href not found in " + xhr.responseText);
              return;
            }
            var innerXhr = new XMLHttpRequest();
            innerXhr.open("GET", pr._links.statuses.href, true);
            innerXhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            innerXhr.onreadystatechange = function() {
              if (innerXhr.readyState === 4) {
                if (xhr.status >= 200 && xhr.status < 299) {
                  var statuses = JSON.parse(innerXhr.responseText);
                  for (var i = 0; i < statuses.length; i++) {
                    var status = statuses[i];
                    if (status.context === "continuous-integration/travis-ci/push") {
                      resolve(status.target_url);
                      return;
                    }
                  }
                  reject("did not find the status continuous-integration/travis-ci/push in " + JSON.stringify(statuses));
                } else {
                  reject("got " + xhr.statusText + " in the HTTP request to " + pr._links.statuses.href);
                  return;
                }
              }
            }
            innerXhr.send();
          } else {
            reject("got " + xhr.statusText + " in the HTTP request to " + api_pull_url);
            return;
          }
        }
      }
      xhr.send();
    })
  }

  // repoPath returns the repo path taken from the URL, repoPath returns an
  // empty string if no repo was found in the URL.
  function repoPath() {
    if (pp.length < 2) {
      return "";
    }
    return "/" + pp[0] + "/" + pp[1];
  }

  function openTravis() {
    var targetURL = "https://travis-ci." + (isGithubPrivateRepo() ? "com" : "org" ) + rp;
    chrome.storage.sync.get(["github_api_username", "github_api_token"], function(data) {
      if (typeof data.github_api_username === "string" && data.github_api_username !== "" && typeof data.github_api_token === "string" && data.github_api_token !== "") {
        if (isGithubPR() === true) {
          getTravisURL(data.github_api_username, data.github_api_token)
            .then(function(url) {
              window.location.href = url;
            })
            .catch(function(error) {
              if (error !== "") {
                Status.setMessage(error);
              }
              setTimeout(function() {
                window.location.href = targetURL;
              }, 1000);
            });
        } else {
          window.location.href = targetURL;
        }
      } else {
        Status.setMessage("API username and password were not found, follow the documentation in the config");
        setTimeout(function() {
          window.location.href = targetURL;
        }, 1000);
      }
    });
  }

  function openGithub() {
    chrome.storage.sync.get(["github_api_username", "github_api_token"], function(data) {
      if (typeof data.github_api_username === "string" && data.github_api_username !== "" && typeof data.github_api_token === "string" && data.github_api_token !== "") {
        getGithubPullRequestURL(data.github_api_username, data.github_api_token)
          .then(function(url) {
            window.location.href = url;
          })
          .catch(function(error) {
            if (error !== "") {
              Status.setMessage(error);
            }
            setTimeout(function() {
              window.location.href = "https://github.com" + rp;
            }, 1000);
          });
      } else {
        Status.setMessage("API username and password were not found, follow the documentation in the config");
        setTimeout(function() {
          window.location.href = "https://github.com" + rp;
        }, 1000);
      }
    });
  }

  // get the repository path, works on both travis and Github
  var rp = repoPath();
  if (rp === "") {
    Status.setMessage("You must be viewing a repository");
    return;
  }

  function openAlternateFile() {
    var file = pp[pp.length - 1];
    if (file.match(/_test\.go$/) !== null) {
      window.location.href = window.location.href.replace('_test.go', '.go');
    } else if (file.match(/\.go$/) !== null) {
      window.location.href = window.location.href.replace('.go', '_test.go');
    }
  }

  // are we on a source file?
  if (window.location.hostname == "github.com") {
    // are we viewing a source file?
    if (pp[2] === "blob") {
      openAlternateFile();
    } else {
      openTravis();
    }
  } else if (window.location.hostname == "travis-ci.com" || window.location.hostname == "travis-ci.org") {
    openGithub();
  }
}

// END Custom functions
//////////////////////////////////////

//////////////////////////////////////
// Custom bindings

mapkey('cb', '#7Copy the last element of the path in the URL', copyLastElementInPath);
mapkey(',.', '#8Open alternate', openAlternate);

// END Custom bindings
//////////////////////////////////////

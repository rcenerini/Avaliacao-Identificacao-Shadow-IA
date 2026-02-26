import os
import requests
from typing import List, Dict, Any

class GitConnector:
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.gitlab_token = os.getenv("GITLAB_TOKEN")
        self.github_api_url = os.getenv("GITHUB_API_URL", "https://api.github.com")
        self.gitlab_api_url = os.getenv("GITLAB_API_URL", "https://gitlab.com/api/v4")

    def get_github_repos(self, org: str) -> List[Dict[str, Any]]:
        """Fetch all repositories for a given GitHub organization."""
        if not self.github_token:
            print("Warning: GITHUB_TOKEN not set. Skipping GitHub repos.")
            return []

        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        repos = []
        page = 1
        while True:
            # We fetch 100 at a time for efficiency
            url = f"{self.github_api_url}/orgs/{org}/repos?per_page=100&page={page}"
            response = requests.get(url, headers=headers)
            if response.status_code != 200:
                print(f"Error fetching GitHub repos: {response.status_code} - {response.text}")
                break
                
            data = response.json()
            if not data:
                break
            repos.extend(data)
            page += 1
            
        return repos

    def get_github_repo_files(self, repo_full_name: str, branch: str = "main") -> List[Dict[str, Any]]:
        """
        Fetch the configuration files of a repository (e.g. package.json, requirements.txt, etc.)
        For a deep scan, we would use the Git Trees API. For this PoC, we use the Trees API to get all paths.
        """
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json"
        }
        
        # Get the tree recursively
        url = f"{self.github_api_url}/repos/{repo_full_name}/git/trees/{branch}?recursive=1"
        response = requests.get(url, headers=headers)
        
        if response.status_code != 200:
            return []
            
        tree = response.json().get('tree', [])
        
        # We target specific files first for efficiency
        target_files = [
            'package.json', 'requirements.txt', 'Pipfile', 'pyproject.toml', 
            'poetry.lock', 'go.mod', 'Cargo.toml', '.env.example'
        ]
        
        files_to_scan = []
        for item in tree:
            if item['type'] == 'blob':
                path = item['path']
                filename = os.path.basename(path)
                
                # We scan targeted configuration files and source code (.js, .ts, .py, .go, .rs)
                if filename in target_files or path.endswith(('.js', '.ts', '.py', '.go', '.rs')):
                    # Only fetch content if needed, but for the PoC, let's fetch it
                    # In a real scenario, downloading all files sequentially is slow. 
                    # We would clone the repo locally or use GraphQL.
                    files_to_scan.append({
                        'path': path,
                        'url': item['url'] # blob URL
                    })
        return files_to_scan

    def get_github_blob_content(self, blob_url: str) -> str:
        """Fetch the raw text content of a blob."""
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3.raw"
        }
        response = requests.get(blob_url, headers=headers)
        if response.status_code == 200:
            return response.text
        return ""

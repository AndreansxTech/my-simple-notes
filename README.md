# My Simple Notes 
Little something I build for the Hackclub Highseas event
**Available at https://my-simple-notes.pages.dev/notes-website/src**
### ❗Warning     The light color theme can be a flashbang ❗
This project is a note-taking website designed with a VS Code-like layout and a glassmorphism design. It allows users to create, edit, and manage their notes efficiently.

- Create, Edit, and Delete Notes: Easily manage your notes with straightforward CRUD operations.
- Tagging System: Organize your notes using customizable tags for quick retrieval.
- Search Functionality: Quickly find notes using the integrated search bar.
- Dark and Light Themes: Toggle between dark and light modes to suit your preference.
- Markdown Support: Write notes in Markdown for enhanced formatting and preview capabilities.
- Version History: Access and restore previous versions of your notes.
- Auto-Save: Your notes are automatically saved every 30 seconds to prevent data loss.
- Export Notes: Download your notes as plain text files for offline access.

## Project Structure

```
notes-website
├── src
│   ├── index.html         # Main HTML document for the website
│   ├── style.css          # Styles implementing glassmorphism design
│   ├── script.js          # Main JavaScript logic for user interactions
│   ├── components
│   │   ├── editor.js      # Class for creating and managing notes
│   │   ├── sidebar.js     # Class for managing the sidebar navigation
│   │   └── theme.js       # Functions for applying different themes
│   └── services
│       └── db.js          # Database for notes with IndexedDB
├── package.json           # Configuration file for npm ( not really needed )
└── README.md              # Documentation for the project
```
# Usage
## Website
- You can simply access the app with my <a href="my-simple-notes.pages.dev/notes-website/src">website</a>
### Or

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/AndreansxTech/my-simple-notes
   ```

2. Navigate to the project directory:
   ```
   cd notes-website
   ```

3. Open the file via a web browser or with live server 
   ```
   src/index.html
   ```


## Usage Guidelines

- Use the sidebar to navigate between notes.
- Click on the editor to create or edit notes.
- Switch between light and dark themes using the theme options.

## Contributing

Feel free to submit issues or pull requests to improve the project!
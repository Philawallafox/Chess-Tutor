/**
 * Chess Tutor - Opening Database Management
 * 
 * This file handles loading and accessing the chess opening database.
 * It provides functions to fetch openings, access specific opening details,
 * and supports both direct loading and lazy loading approaches.
 */

// Store loaded openings data
let openingsData = null;
let loadedOpenings = {};

/**
 * Load the complete openings database
 * Note: This loads all openings at once. For a large database,
 * consider switching to loadOpeningLazy() instead.
 */
async function loadOpeningsDatabase() {
    try {
        // Check if we've already loaded the database
        if (openingsData !== null) {
            return openingsData;
        }
        
        // Fetch the openings JSON file
        const response = await fetch('data/openings.json');
        
        // Check if the request was successful
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON data
        const data = await response.json();
        
        // Store the openings data
        openingsData = data.openings;
        
        console.log(`Loaded ${openingsData.length} openings`);
        return openingsData;
    } catch (error) {
        console.error('Error loading openings database:', error);
        // Return an empty array to prevent errors elsewhere
        return [];
    }
}

/**
 * Get all openings with basic information
 * This function returns a simplified list of all openings for UI display
 */
async function getOpeningsList() {
    const openings = await loadOpeningsDatabase();
    
    // Return a simplified list with just the necessary information for a list view
    return openings.map(opening => {
        return {
            id: opening.id,
            name: opening.name,
            difficulty: opening.difficulty,
            popularity: opening.popularity,
            keyPosition: opening.key_position
        };
    });
}

/**
 * Get complete details for a specific opening
 */
async function getOpeningDetails(openingId) {
    const openings = await loadOpeningsDatabase();
    return openings.find(opening => opening.id === openingId);
}

/**
 * Get the main line moves for an opening
 */
async function getOpeningMainLine(openingId) {
    const opening = await getOpeningDetails(openingId);
    return opening ? opening.main_line : [];
}

/**
 * LAZY LOADING IMPLEMENTATION
 * 
 * The following functions implement a lazy loading approach that can be used
 * if the database grows very large. This approach loads only basic opening information
 * initially, then loads detailed data for specific openings on demand.
 * 
 * To switch to lazy loading:
 * 1. Create a data/openings-index.json file with basic opening info and file paths
 * 2. Split each opening into its own JSON file
 * 3. Comment out the functions above and uncomment these functions
 */

/*
async function loadOpeningsIndex() {
    try {
        // Check if we've already loaded the index
        if (openingsData !== null) {
            return openingsData;
        }
        
        // Fetch the openings index
        const response = await fetch('data/openings-index.json');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the JSON data
        const data = await response.json();
        
        // Store the openings index
        openingsData = data.openings;
        
        console.log(`Loaded index with ${openingsData.length} openings`);
        return openingsData;
    } catch (error) {
        console.error('Error loading openings index:', error);
        return [];
    }
}

async function getOpeningsList() {
    // This function works the same with lazy loading - just return the index info
    return await loadOpeningsIndex();
}

async function getOpeningDetails(openingId) {
    // Check if we've already loaded this opening
    if (loadedOpenings[openingId]) {
        return loadedOpenings[openingId];
    }
    
    // Look up the opening in the index
    const openingsIndex = await loadOpeningsIndex();
    const openingInfo = openingsIndex.find(opening => opening.id === openingId);
    
    if (!openingInfo) {
        console.error('Opening not found:', openingId);
        return null;
    }
    
    try {
        // Fetch the detailed opening data
        const response = await fetch(`data/${openingInfo.file}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Parse the opening data
        const openingData = await response.json();
        
        // Cache for future use
        loadedOpenings[openingId] = openingData;
        
        return openingData;
    } catch (error) {
        console.error(`Error loading details for ${openingId}:`, error);
        return null;
    }
}

async function getOpeningMainLine(openingId) {
    const opening = await getOpeningDetails(openingId);
    return opening ? opening.main_line : [];
}
*/

// Make functions available globally (since we're not using modules)
window.loadOpeningsDatabase = loadOpeningsDatabase;
window.getOpeningsList = getOpeningsList;
window.getOpeningDetails = getOpeningDetails;
window.getOpeningMainLine = getOpeningMainLine;
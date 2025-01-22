import { checkAndCleanRooms } from '../app/lib/db/checkRooms'

async function main() {
    try {
        await checkAndCleanRooms()
    } catch (error) {
        console.error('Error:', error)
    }
}

main() 
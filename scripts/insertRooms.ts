async function insertRooms() {
    try {
        const response = await fetch('http://localhost:3000/api/setup/rooms', {
            method: 'POST'
        })
        
        const data = await response.json()
        
        if (response.ok) {
            console.log('Salas insertadas correctamente')
        } else {
            console.error('Error:', data.error)
            console.error('Detalles:', data.details)
            console.error('Código:', data.code)
        }
    } catch (error) {
        console.error('Error ejecutando el script:', error)
    }
}

insertRooms() 
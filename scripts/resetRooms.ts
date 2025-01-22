async function resetRooms() {
    try {
        // 1. Ver salas actuales
        console.log('Obteniendo salas actuales...')
        const response1 = await fetch('http://localhost:3000/api/setup/rooms')
        const data1 = await response1.json()
        
        if (data1.salas) {
            console.log('\nSalas actuales:')
            data1.salas.forEach((sala: any) => {
                console.log(sala.nombre)
            })
        }
        
        // 2. Eliminar todas las salas
        console.log('\nEliminando salas existentes...')
        const response2 = await fetch('http://localhost:3000/api/setup/rooms', {
            method: 'DELETE'
        })
        
        if (!response2.ok) {
            throw new Error('Error eliminando salas')
        }
        
        // 3. Insertar salas nuevamente
        console.log('\nInsertando salas nuevamente...')
        const response3 = await fetch('http://localhost:3000/api/setup/rooms', {
            method: 'POST'
        })
        
        if (!response3.ok) {
            throw new Error('Error insertando salas')
        }
        
        // 4. Verificar resultado final
        console.log('\nVerificando resultado final...')
        const response4 = await fetch('http://localhost:3000/api/setup/rooms')
        const data4 = await response4.json()
        
        if (data4.salas) {
            console.log('\nSalas finales:')
            data4.salas.forEach((sala: any) => {
                console.log(sala.nombre)
            })
        }
        
    } catch (error) {
        console.error('Error:', error)
    }
}

resetRooms() 
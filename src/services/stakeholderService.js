/**
 * StakeholderService
 * Handles CRUD operations and business logic for stakeholders and maps
 */
import { db, auth } from '@/firebase'
import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore'
import { Stakeholder } from '@/models/Stakeholder'
import { StakeholderMap } from '@/models/StakeholderMap'
import aiService from './aiService'

class StakeholderService {
  /**
   * Collection references
   */
  get mapsCollection() {
    return collection(db, 'stakeholderMaps')
  }

  /**
   * Get stakeholder map reference by ID
   * @param {string} mapId - The map ID
   * @returns {DocumentReference} Firestore document reference
   */
  getMapRef(mapId) {
    return doc(this.mapsCollection, mapId)
  }

  /**
   * Get stakeholders subcollection reference for a map
   * @param {string} mapId - The map ID
   * @returns {CollectionReference} Firestore collection reference
   */
  getStakeholdersCollection(mapId) {
    return collection(this.getMapRef(mapId), 'stakeholders')
  }

  /**
   * Get stakeholder document reference
   * @param {string} mapId - The map ID
   * @param {string} stakeholderId - The stakeholder ID
   * @returns {DocumentReference} Firestore document reference
   */
  getStakeholderRef(mapId, stakeholderId) {
    return doc(this.getStakeholdersCollection(mapId), stakeholderId)
  }

  /**
   * Get interactions subcollection for a stakeholder
   * @param {string} mapId - The map ID
   * @param {string} stakeholderId - The stakeholder ID
   * @returns {CollectionReference} Firestore collection reference
   */
  getInteractionsCollection(mapId, stakeholderId) {
    return collection(this.getStakeholderRef(mapId, stakeholderId), 'interactions')
  }

  /**
   * Convert a Firestore timestamp to Date
   * @param {Timestamp|Date} timestamp - Firestore timestamp or Date
   * @returns {Date} JavaScript Date
   */
  _convertTimestamp(timestamp) {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate()
    }
    return timestamp || new Date()
  }

  /**
   * Convert Firestore data to model instance
   * @param {Object} docData - Firestore document data
   * @param {string} docId - Document ID
   * @returns {Object} Prepared document data with proper Date objects
   */
  _prepareDocData(docData, docId) {
    // Add ID to data
    const data = {
      ...docData,
      id: docId,
      createdAt: this._convertTimestamp(docData.createdAt),
      updatedAt: this._convertTimestamp(docData.updatedAt)
    }

    // Convert any other timestamp fields
    if (data.interactions) {
      data.interactions = data.interactions.map(interaction => ({
        ...interaction,
        date: this._convertTimestamp(interaction.date),
        createdAt: this._convertTimestamp(interaction.createdAt)
      }))
    }

    return data
  }

  /**
   * Get current user ID
   * @returns {string|null} Current user ID or null if not authenticated
   */
  get currentUserId() {
    return auth.currentUser?.uid || null
  }

  /**
   * Check if a user has access to a map
   * @param {string} mapId - The map ID
   * @returns {Promise<boolean>} Whether the user has access
   */
  async hasMapAccess(mapId) {
    try {
      const userId = this.currentUserId

      if (!userId) {
        return false
      }

      const mapDoc = await getDoc(this.getMapRef(mapId))

      if (!mapDoc.exists()) {
        return false
      }

      const mapData = mapDoc.data()

      // Check if user is the owner or has explicit access
      return (
        mapData.createdBy === userId ||
        (mapData.sharedWith && mapData.sharedWith.includes(userId))
      )
    } catch (error) {
      console.error('Error checking map access:', error)
      return false
    }
  }

  /**
   * Create a new stakeholder map
   * @param {Object} mapData - Map data
   * @returns {Promise<StakeholderMap>} Created map
   */
  async createMap(mapData = {}) {
    try {
      const userId = this.currentUserId

      if (!userId) {
        throw new Error('User must be authenticated to create a map')
      }

      // Create a new map model with the provided data
      const map = new StakeholderMap({
        ...mapData,
        createdBy: userId
      })

      // Prepare data for Firestore
      const mapObject = map.toObject()
      const { stakeholders, ...mapDataForStore } = mapObject

      // Add timestamps for Firestore
      const dataWithTimestamps = {
        ...mapDataForStore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Add the map document to Firestore
      const mapDocRef = await addDoc(this.mapsCollection, dataWithTimestamps)

      // Now create each stakeholder as a subcollection document
      if (stakeholders && stakeholders.length > 0) {
        const stakeholdersCollection = this.getStakeholdersCollection(mapDocRef.id)

        for (const stakeholderData of stakeholders) {
          // Add timestamps for Firestore
          const stakeholderWithTimestamps = {
            ...stakeholderData,
            mapId: mapDocRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }

          // Store interactions separately
          const { interactions, ...stakeholderDataForStore } = stakeholderWithTimestamps

          // Add the stakeholder to Firestore
          const stakeholderDocRef = await addDoc(stakeholdersCollection, stakeholderDataForStore)

          // Add interactions if any
          if (interactions && interactions.length > 0) {
            const interactionsCollection = this.getInteractionsCollection(mapDocRef.id, stakeholderDocRef.id)

            for (const interactionData of interactions) {
              await addDoc(interactionsCollection, {
                ...interactionData,
                createdAt: serverTimestamp(),
                date: interactionData.date || serverTimestamp()
              })
            }
          }
        }
      }

      // Return the created map with the new ID
      return new StakeholderMap({
        ...map.toObject(),
        id: mapDocRef.id
      })
    } catch (error) {
      console.error('Error creating stakeholder map:', error)
      throw error
    }
  }

  /**
   * Get a stakeholder map by ID
   * @param {string} mapId - The map ID
   * @returns {Promise<StakeholderMap>} The stakeholder map
   */
  async getMap(mapId) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder map')
      }

      // Get the map document
      const mapDocRef = this.getMapRef(mapId)
      const mapDoc = await getDoc(mapDocRef)

      if (!mapDoc.exists()) {
        throw new Error('Stakeholder map not found')
      }

      // Get map data with proper dates
      const mapData = this._prepareDocData(mapDoc.data(), mapDoc.id)

      // Get all stakeholders for this map
      const stakeholdersCollection = this.getStakeholdersCollection(mapId)
      const stakeholdersQuery = query(stakeholdersCollection, orderBy('name'))
      const stakeholderDocs = await getDocs(stakeholdersQuery)

      // Convert to Stakeholder instances
      const stakeholders = []

      for (const stakeholderDoc of stakeholderDocs.docs) {
        const stakeholderData = this._prepareDocData(stakeholderDoc.data(), stakeholderDoc.id)

        // Get interactions for this stakeholder
        const interactionsCollection = this.getInteractionsCollection(mapId, stakeholderDoc.id)
        const interactionsQuery = query(interactionsCollection, orderBy('date', 'desc'))
        const interactionDocs = await getDocs(interactionsQuery)

        // Add interactions to stakeholder data
        stakeholderData.interactions = interactionDocs.docs.map(interactionDoc =>
          this._prepareDocData(interactionDoc.data(), interactionDoc.id)
        )

        // Create stakeholder instance and add to array
        stakeholders.push(new Stakeholder(stakeholderData))
      }

      // Create and return the full StakeholderMap with all data
      return new StakeholderMap({
        ...mapData,
        stakeholders
      })
    } catch (error) {
      console.error('Error getting stakeholder map:', error)
      throw error
    }
  }

  /**
   * Get all stakeholder maps for the current user
   * @param {boolean} includeArchived - Whether to include archived maps
   * @returns {Promise<StakeholderMap[]>} List of stakeholder maps
   */
  async getAllMaps(includeArchived = false) {
    try {
      const userId = this.currentUserId

      if (!userId) {
        throw new Error('User must be authenticated to get maps')
      }

      // Query for maps created by the user or shared with them
      let mapsQuery = query(
        this.mapsCollection,
        where('createdBy', '==', userId),
        orderBy('updatedAt', 'desc')
      )

      // If not including archived, add filter
      if (!includeArchived) {
        mapsQuery = query(
          this.mapsCollection,
          where('createdBy', '==', userId),
          where('isArchived', '==', false),
          orderBy('updatedAt', 'desc')
        )
      }

      const mapDocs = await getDocs(mapsQuery)

      // Also get maps shared with the user
      let sharedMapsQuery = query(
        this.mapsCollection,
        where('sharedWith', 'array-contains', userId),
        orderBy('updatedAt', 'desc')
      )

      if (!includeArchived) {
        sharedMapsQuery = query(
          this.mapsCollection,
          where('sharedWith', 'array-contains', userId),
          where('isArchived', '==', false),
          orderBy('updatedAt', 'desc')
        )
      }

      const sharedMapDocs = await getDocs(sharedMapsQuery)

      // Combine the results
      const allMapDocs = [...mapDocs.docs, ...sharedMapDocs.docs]

      // Convert to StakeholderMap instances (without stakeholders for efficiency)
      return allMapDocs.map(mapDoc => {
        const mapData = this._prepareDocData(mapDoc.data(), mapDoc.id)
        return new StakeholderMap(mapData)
      })
    } catch (error) {
      console.error('Error getting stakeholder maps:', error)
      throw error
    }
  }

  /**
   * Update a stakeholder map
   * @param {string} mapId - The map ID
   * @param {Object} updates - Map updates
   * @returns {Promise<StakeholderMap>} Updated map
   */
  async updateMap(mapId, updates) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder map')
      }

      // Get the map reference
      const mapRef = this.getMapRef(mapId)

      // Filter out properties that shouldn't be directly updated
      const { id, stakeholders, createdAt, createdBy, ...updateData } = updates

      // Add updated timestamp
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: serverTimestamp()
      }

      // Update the map
      await updateDoc(mapRef, dataWithTimestamp)

      // Get the updated map
      return this.getMap(mapId)
    } catch (error) {
      console.error('Error updating stakeholder map:', error)
      throw error
    }
  }

  /**
   * Delete a stakeholder map
   * @param {string} mapId - The map ID
   * @returns {Promise<void>}
   */
  async deleteMap(mapId) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder map')
      }

      // Get all stakeholders for this map
      const stakeholdersCollection = this.getStakeholdersCollection(mapId)
      const stakeholderDocs = await getDocs(stakeholdersCollection)

      // Delete each stakeholder and its interactions
      for (const stakeholderDoc of stakeholderDocs.docs) {
        const stakeholderId = stakeholderDoc.id

        // Delete interactions first
        const interactionsCollection = this.getInteractionsCollection(mapId, stakeholderId)
        const interactionDocs = await getDocs(interactionsCollection)

        for (const interactionDoc of interactionDocs.docs) {
          await deleteDoc(interactionDoc.ref)
        }

        // Then delete the stakeholder
        await deleteDoc(stakeholderDoc.ref)
      }

      // Finally delete the map
      await deleteDoc(this.getMapRef(mapId))
    } catch (error) {
      console.error('Error deleting stakeholder map:', error)
      throw error
    }
  }

  /**
   * Archive a stakeholder map
   * @param {string} mapId - The map ID
   * @returns {Promise<StakeholderMap>} Updated map
   */
  async archiveMap(mapId) {
    return this.updateMap(mapId, { isArchived: true })
  }

  /**
   * Unarchive a stakeholder map
   * @param {string} mapId - The map ID
   * @returns {Promise<StakeholderMap>} Updated map
   */
  async unarchiveMap(mapId) {
    return this.updateMap(mapId, { isArchived: false })
  }

  /**
   * Add a stakeholder to a map
   * @param {string} mapId - The map ID
   * @param {Object} stakeholderData - Stakeholder data
   * @returns {Promise<Stakeholder>} Created stakeholder
   */
  async addStakeholder(mapId, stakeholderData) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder map')
      }

      // Create stakeholder model
      const stakeholder = new Stakeholder({
        ...stakeholderData,
        mapId,
        createdBy: this.currentUserId
      })

      // Prepare data for Firestore (without interactions)
      const { interactions, ...stakeholderForStore } = stakeholder.toObject()

      // Add timestamps
      const dataWithTimestamps = {
        ...stakeholderForStore,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Add to Firestore
      const stakeholderDocRef = await addDoc(
        this.getStakeholdersCollection(mapId),
        dataWithTimestamps
      )

      // If there are interactions, add them
      if (interactions && interactions.length > 0) {
        const interactionsCollection = this.getInteractionsCollection(mapId, stakeholderDocRef.id)

        for (const interactionData of interactions) {
          await addDoc(interactionsCollection, {
            ...interactionData,
            createdAt: serverTimestamp(),
            date: interactionData.date || serverTimestamp()
          })
        }
      }

      // Update the map's updatedAt timestamp
      await updateDoc(this.getMapRef(mapId), {
        updatedAt: serverTimestamp()
      })

      // Return the created stakeholder with the new ID
      return new Stakeholder({
        ...stakeholder.toObject(),
        id: stakeholderDocRef.id
      })
    } catch (error) {
      console.error('Error adding stakeholder:', error)
      throw error
    }
  }

  /**
   * Get a stakeholder by ID
   * @param {string} mapId - The map ID
   * @param {string} stakeholderId - The stakeholder ID
   * @returns {Promise<Stakeholder>} The stakeholder
   */
  async getStakeholder(mapId, stakeholderId) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder')
      }

      // Get the stakeholder document
      const stakeholderRef = this.getStakeholderRef(mapId, stakeholderId)
      const stakeholderDoc = await getDoc(stakeholderRef)

      if (!stakeholderDoc.exists()) {
        throw new Error('Stakeholder not found')
      }

      // Get stakeholder data
      const stakeholderData = this._prepareDocData(stakeholderDoc.data(), stakeholderDoc.id)

      // Get interactions
      const interactionsCollection = this.getInteractionsCollection(mapId, stakeholderId)
      const interactionsQuery = query(interactionsCollection, orderBy('date', 'desc'))
      const interactionDocs = await getDocs(interactionsQuery)

      // Add interactions to stakeholder data
      stakeholderData.interactions = interactionDocs.docs.map(interactionDoc =>
        this._prepareDocData(interactionDoc.data(), interactionDoc.id)
      )

      // Return stakeholder instance
      return new Stakeholder(stakeholderData)
    } catch (error) {
      console.error('Error getting stakeholder:', error)
      throw error
    }
  }

  /**
   * Update a stakeholder
   * @param {string} mapId - The map ID
   * @param {string} stakeholderId - The stakeholder ID
   * @param {Object} updates - Stakeholder updates
   * @returns {Promise<Stakeholder>} Updated stakeholder
   */
  async updateStakeholder(mapId, stakeholderId, updates) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder')
      }

      // Get the stakeholder reference
      const stakeholderRef = this.getStakeholderRef(mapId, stakeholderId)

      // Filter out properties that shouldn't be directly updated
      const { id, mapId: _, interactions, createdAt, createdBy, ...updateData } = updates

      // Add updated timestamp
      const dataWithTimestamp = {
        ...updateData,
        updatedAt: serverTimestamp()
      }

      // Update the stakeholder
      await updateDoc(stakeholderRef, dataWithTimestamp)

      // Update the map's updatedAt timestamp
      await updateDoc(this.getMapRef(mapId), {
        updatedAt: serverTimestamp()
      })

      // Get the updated stakeholder
      return this.getStakeholder(mapId, stakeholderId)
    } catch (error) {
      console.error('Error updating stakeholder:', error)
      throw error
    }
  }

  /**
   * Delete a stakeholder
   * @param {string} mapId - The map ID
   * @param {string} stakeholderId - The stakeholder ID
   * @returns {Promise<void>}
   */
  async deleteStakeholder(mapId, stakeholderId) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder')
      }

      // Delete interactions first
      const interactionsCollection = this.getInteractionsCollection(mapId, stakeholderId)
      const interactionDocs = await getDocs(interactionsCollection)

      for (const interactionDoc of interactionDocs.docs) {
        await deleteDoc(interactionDoc.ref)
      }

      // Delete the stakeholder
      await deleteDoc(this.getStakeholderRef(mapId, stakeholderId))

      // Update the map's updatedAt timestamp
      await updateDoc(this.getMapRef(mapId), {
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error deleting stakeholder:', error)
      throw error
    }
  }

  /**
   * Add an interaction to a stakeholder
   * @param {string} mapId - The map ID
   * @param {string} stakeholderId - The stakeholder ID
   * @param {Object} interactionData - Interaction data
   * @returns {Promise<Object>} Created interaction
   */
  async addStakeholderInteraction(mapId, stakeholderId, interactionData) {
    try {
      // Check access
      const hasAccess = await this.hasMapAccess(mapId)

      if (!hasAccess) {
        throw new Error('Access denied to this stakeholder')
      }

      // Prepare interaction data
      const interaction = {
        ...interactionData,
        id: interactionData.id || crypto.randomUUID(),
        date: interactionData.date || new Date(),
        createdAt: serverTimestamp(),
        createdBy: this.currentUserId
      }

      // Add to Firestore
      const interactionsCollection = this.getInteractionsCollection(mapId, stakeholderId)
      const interactionDocRef = await addDoc(interactionsCollection, interaction)

      // Update the stakeholder's updatedAt timestamp
      await updateDoc(this.getStakeholderRef(mapId, stakeholderId), {
        updatedAt: serverTimestamp()
      })

      // Update the map's updatedAt timestamp
      await updateDoc(this.getMapRef(mapId), {
        updatedAt: serverTimestamp()
      })

      // Return the created interaction with the new ID
      return {
        ...interaction,
        id: interactionDocRef.id
      }
    } catch (error) {
      console.error('Error adding stakeholder interaction:', error)
      throw error
    }
  }

  /**
   * Get AI-powered recommendations for stakeholder engagement
   * @param {string} mapId - The map ID
   * @param {Object} options - Options for the recommendation
   * @returns {Promise<Object>} AI recommendations
   */
  async getStakeholderRecommendations(mapId, options = {}) {
    try {
      // Get the map with all stakeholders
      const map = await this.getMap(mapId)

      // Get recommendations from AI service
      return aiService.getStakeholderRecommendations(map, options)
    } catch (error) {
      console.error('Error getting stakeholder recommendations:', error)
      throw error
    }
  }
}

export default new StakeholderService()

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Common validation functions
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }
    
    function hasValidFields(requiredFields, optionalFields) {
      let allFields = requiredFields.concat(optionalFields);
      return request.resource.data.keys().hasOnly(allFields) &&
             request.resource.data.keys().hasAll(requiredFields);
    }
    
    function isValidTimestamp(field) {
      return request.resource.data[field] is timestamp;
    }
    
    // Users collection rules
    match /users/{userId} {
      // Allow read only by the owner
      allow read: if isOwner(userId);
      
      // Allow create with valid fields
      allow create: if isOwner(userId) &&
                      hasValidFields(
                        ['email'], 
                        ['displayName', 'photoURL', 'createdAt', 'lastLogin']
                      ) &&
                      isValidTimestamp('createdAt') &&
                      isValidTimestamp('lastLogin');
      
      // Allow update with valid fields
      allow update: if isOwner(userId) &&
                      hasValidFields(
                        [], 
                        ['displayName', 'photoURL', 'lastLogin', 'settings']
                      ) &&
                      (
                        !('lastLogin' in request.resource.data) || 
                        isValidTimestamp('lastLogin')
                      );
      
      // No deletes allowed
      allow delete: if false;
    }
    
    // Maps collection rules
    match /maps/{mapId} {
      // Allow read by owner
      allow read: if isSignedIn() && request.auth.uid == resource.data.ownerId;
      
      // Allow create with valid fields and current user as owner
      allow create: if isSignedIn() &&
                      request.resource.data.ownerId == request.auth.uid &&
                      hasValidFields(
                        ['name', 'ownerId', 'created', 'updated'], 
                        ['description']
                      ) &&
                      isValidTimestamp('created') &&
                      isValidTimestamp('updated');
      
      // Allow update with valid fields by owner
      allow update: if isSignedIn() &&
                      resource.data.ownerId == request.auth.uid &&
                      hasValidFields(
                        ['name', 'ownerId', 'created', 'updated'], 
                        ['description']
                      ) &&
                      request.resource.data.ownerId == resource.data.ownerId &&
                      isValidTimestamp('updated');
      
      // Allow delete by owner
      allow delete: if isSignedIn() && resource.data.ownerId == request.auth.uid;
    }
    
    // Stakeholders collection rules
    match /stakeholders/{stakeholderId} {
      // Function to check if user owns the map this stakeholder belongs to
      function ownsParentMap() {
        let mapId = resource.data.mapId;
        let mapData = get(/databases/$(database)/documents/maps/$(mapId)).data;
        return isSignedIn() && mapData.ownerId == request.auth.uid;
      }
      
      // Function to check if user owns the map for a new stakeholder
      function ownsNewParentMap() {
        let mapId = request.resource.data.mapId;
        let mapData = get(/databases/$(database)/documents/maps/$(mapId)).data;
        return isSignedIn() && mapData.ownerId == request.auth.uid;
      }
      
      // Allow read by map owner
      allow read: if isSignedIn() && ownsParentMap();
      
      // Allow create with valid fields by map owner
      allow create: if isSignedIn() &&
                      ownsNewParentMap() &&
                      hasValidFields(
                        ['name', 'mapId', 'created', 'updated'], 
                        [
                          'influence', 'impact', 'relationship', 'interests',
                          'contribution', 'risk', 'communication', 'strategy',
                          'measurement', 'category', 'interactions'
                        ]
                      ) &&
                      isValidTimestamp('created') &&
                      isValidTimestamp('updated');
      
      // Allow update with valid fields by map owner
      allow update: if isSignedIn() &&
                      ownsParentMap() &&
                      hasValidFields(
                        ['name', 'mapId', 'created', 'updated'], 
                        [
                          'influence', 'impact', 'relationship', 'interests',
                          'contribution', 'risk', 'communication', 'strategy',
                          'measurement', 'category', 'interactions'
                        ]
                      ) &&
                      request.resource.data.mapId == resource.data.mapId &&
                      isValidTimestamp('updated');
      
      // Allow delete by map owner
      allow delete: if isSignedIn() && ownsParentMap();
    }
    
    // Deny access to all other documents
    match /{document=**} {
      allow read, write: if false;
    }
  }
}

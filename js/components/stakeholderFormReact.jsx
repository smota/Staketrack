<>
  <div className="form-group">
    <label htmlFor="influence">Influence: {formData.influence}</label>
    <input
      type="range"
      className="form-control-range"
      id="influence"
      name="influence"
      min="1"
      max="10"
      value={formData.influence}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="impact">Impact: {formData.impact}</label>
    <input
      type="range"
      className="form-control-range"
      id="impact"
      name="impact"
      min="1"
      max="10"
      value={formData.impact}
      onChange={handleInputChange}
    />
  </div>

  <div className="form-group">
    <label htmlFor="relationshipQuality">Relationship Quality: {formData.relationshipQuality}</label>
    <input
      type="range"
      className="form-control-range"
      id="relationshipQuality"
      name="relationshipQuality"
      min="1"
      max="10"
      value={formData.relationshipQuality}
      onChange={handleInputChange}
    />
  </div>
</> 
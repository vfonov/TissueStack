/*
 * This file is part of TissueStack.
 *
 * TissueStack is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * TissueStack is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with TissueStack.  If not, see <http://www.gnu.org/licenses/>.
 */
package au.edu.uq.cai.TissueStack.dataobjects;

import java.math.BigDecimal;

import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;

@Entity
@Table(name="dataset_planes")
@XmlRootElement(name="DataSetPlanes", namespace=IGlobalConstants.XML_NAMESPACE)
public class DataSetPlanes{
	  private long id;
	  private long datasetId;
	  String internalIsTiled;
	  private String name;
	  private int maxX; 
	  private int maxY; 
	  private int maxSlices; 
	  private String zoomLevels; 
	  private int oneToOneZoomLevel; 
	  private String transformationMatrix;
	  private BigDecimal resolutionMm;
	  private BigDecimal valueRangeMin;
	  private BigDecimal valueRangeMax;

	@Id	@GeneratedValue(strategy = GenerationType.IDENTITY)
 	@Column(name="id")
	public long getId() {
		return id;
	}
	public void setId(long id) {
		this.id = id;
	}
	
	@Column(name="dataset_id")
	@XmlTransient
	public long getDatasetId() {
		return datasetId;
	}
	
	public void setDatasetId(long datasetId) {
		this.datasetId = datasetId;
	}
	
	@XmlTransient
	@Column(name="is_tiled")
	public String getInternalIsTiled() {
	return this.internalIsTiled;
	}

	public void setInternalIsTiled(String internalIsTiled) {
		this.internalIsTiled = internalIsTiled;
	}
		   
	@XmlElement(name="IsTiled", namespace=IGlobalConstants.XML_NAMESPACE)
	@Transient
	public boolean getIsTiled() {
		if (this.internalIsTiled == null || this.internalIsTiled.trim().isEmpty()) {
			return false;
		}
		
		return this.internalIsTiled.trim().equalsIgnoreCase("T") || this.internalIsTiled.trim().equalsIgnoreCase("Y");
	}
	
	@Column(name="name")
	@XmlElement(name="Name", namespace=IGlobalConstants.XML_NAMESPACE)	
	public String getName() {
		return name;
	}
	
	public void setName(String name) {
		this.name = name;
	}
	
	@Column(name="max_x")
	@XmlElement(name="MaxX", namespace=IGlobalConstants.XML_NAMESPACE)	
	public int getMaxX() {
		return maxX;
	}
	
	public void setMaxX(int maxX) {
		this.maxX = maxX;
	}
	
	@Column(name="max_y")
	@XmlElement(name="MaxY", namespace=IGlobalConstants.XML_NAMESPACE)	
	public int getMaxY() {
		return maxY;
	}
	
	public void setMaxY(int maxY) {
		this.maxY = maxY;
	}
	
	@Column(name="max_slices")
	@XmlElement(name="MaxSlices", namespace=IGlobalConstants.XML_NAMESPACE)	
	public int getMaxSlices() {
		return maxSlices;
	}
	
	public void setMaxSlices(int maxSlices) {
		this.maxSlices = maxSlices;
	}
	
	@Column(name="zoom_levels")
	@XmlElement(name="ZoomLevels", namespace=IGlobalConstants.XML_NAMESPACE)	
	public String getZoomLevels() {
		return zoomLevels;
	}
	
	public void setZoomLevels(String zoomLevels) {
		this.zoomLevels = zoomLevels;
	}
	
	@Column(name="one_to_one_zoom_level")
	@XmlElement(name="OneToOneZoomLevel", namespace=IGlobalConstants.XML_NAMESPACE)	
	public int getOneToOneZoomLevel() {
		return oneToOneZoomLevel;
	}
	
	public void setOneToOneZoomLevel(int oneToOneZoomLevel) {
		this.oneToOneZoomLevel = oneToOneZoomLevel;
	}
	
	@Column(name="transformation_matrix")
	@XmlElement(name="TransformationMatrix", namespace=IGlobalConstants.XML_NAMESPACE)	
	public String getTransformationMatrix() {
		return transformationMatrix;
	}
	
	public void setTransformationMatrix(String transformationMatrix) {
		this.transformationMatrix = transformationMatrix;
	}
	
	@Column(name="resolution_mm")
	@XmlElement(name="ResolutionInMm", namespace=IGlobalConstants.XML_NAMESPACE)	
	public BigDecimal getResolutionMm() {
		return this.resolutionMm;
	}
	
	public void setResolutionMm(BigDecimal resolutionMm) {
		this.resolutionMm = resolutionMm;
	}
	
	@Column(name="value_range_min")
	@XmlElement(name="ValueRangeMinimum", namespace=IGlobalConstants.XML_NAMESPACE)	
	public BigDecimal getValueRangeMin() {
		return this.valueRangeMin;
	}
	
	public void setValueRangeMin(BigDecimal valueRangeMin) {
		this.valueRangeMin = valueRangeMin;
	}
	
	@Column(name="value_range_max")
	@XmlElement(name="ValueRangeMaximum", namespace=IGlobalConstants.XML_NAMESPACE)	
	public BigDecimal getValueRangeMax() {
		return this.valueRangeMax;
	}
	
	public void setValueRangeMax(BigDecimal valueRangeMax) {
		this.valueRangeMax = valueRangeMax;
	}
}


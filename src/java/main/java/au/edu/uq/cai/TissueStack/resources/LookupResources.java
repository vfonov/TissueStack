package au.edu.uq.cai.TissueStack.resources;

import java.io.File;

import javax.persistence.EntityManager;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;

import au.edu.uq.cai.TissueStack.JPAUtils;
import au.edu.uq.cai.TissueStack.dataobjects.Configuration;
import au.edu.uq.cai.TissueStack.dataobjects.DataSetValuesLookupTable;
import au.edu.uq.cai.TissueStack.dataobjects.NoResults;
import au.edu.uq.cai.TissueStack.dataobjects.Response;
import au.edu.uq.cai.TissueStack.dataprovider.ConfigurationDataProvider;
import au.edu.uq.cai.TissueStack.dataprovider.DataSetValuesLookupProvider;
import au.edu.uq.cai.TissueStack.rest.AbstractRestfulMetaInformation;
import au.edu.uq.cai.TissueStack.rest.Description;

@Path("/lookup")
@Description("DataSet Lookup Tables")
public final class LookupResources extends AbstractRestfulMetaInformation {
	private static final String DEFAULT_LOOKUP_TABLES_DIRECTORY = "/opt/tissuestack/lookup";	
	
	private File getLookupTablesDirectory() {
		final Configuration lookupTablesDir = ConfigurationDataProvider.queryConfigurationById("lookup_tables_directory");
		return new File(lookupTablesDir == null || lookupTablesDir.getValue() == null ? DEFAULT_LOOKUP_TABLES_DIRECTORY : lookupTablesDir.getValue());
	}

	@Path("/")
	public RestfulResource getDefault() {
		return this.getLookupResourcesMetaInfo();
	}

	@Path("/{id}")
	@Description("Returns the data set's lookup table info as long as it exists")
	public RestfulResource getDataSetLookupTableByIdDefault(
			@Description("Mandatory Paramter 'id': points towards the data sets id in the database")
			@PathParam("id") String id) {
		final DataSetValuesLookupTable dataSetLookupTable = this.getDataSetLookupTableByIdInternal(id);
		if (dataSetLookupTable == null) {
			return new RestfulResource(new Response(new NoResults()));
		}
		return new RestfulResource(new Response(dataSetLookupTable));
	}

	private DataSetValuesLookupTable getDataSetLookupTableByIdInternal(String id) {
		long idAsLong = -1;
		if (id == null) {
			throw new IllegalArgumentException("Parameter 'id' is mandatory!");
		}
		try {
			idAsLong = Long.parseLong(id);
		} catch (Exception e) {
			throw new IllegalArgumentException("Parameter 'id' is not numeric!");
		}
		
		EntityManager em = null; 
		try {
			em = JPAUtils.instance().getEntityManager(); 
			
			return em.find(DataSetValuesLookupTable.class, idAsLong);
		} finally {
			JPAUtils.instance().closeEntityManager(em);
		}
	}

	@Path("/content")
	@GET
	@Produces(MediaType.TEXT_PLAIN)
	@Description("Reads lookup table content from the configuration's lookup file")
	public String getDataSetLookupTableContent(
			@Description("Mandatory Paramter 'file': lookup table file name")
			@QueryParam("file") String file) {
		if (file == null || !new File(file).exists() || !new File(file).canRead())
			throw new IllegalArgumentException("File param is either null or refers to a non-existing/non-readable file!");
		
		DataSetValuesLookupTable dataSetLookupTable = new DataSetValuesLookupTable();
		dataSetLookupTable.setFilename(file);
		
		dataSetLookupTable = DataSetValuesLookupProvider.readLookupContentFromFile(dataSetLookupTable);
		if (dataSetLookupTable == null) {
			return "No Content";
		}
		return dataSetLookupTable.getContent();
	}

	@Path("/meta-info")
	@Description("Shows the Tissue Stack Lookup Resource's Meta Info.")
	public RestfulResource getLookupResourcesMetaInfo() {
		return new RestfulResource(new Response(this.getMetaInfo()));
	}
}

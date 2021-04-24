Bamboo Specs provides the capability to programmatically configure Bamboo using code. Storing your plan configuration as code makes things such as automation, change tracking, and validation easier. These plans would no longer be edited through the Bamboo UI, but instead would be edited through the pipeline specification code that is stored in this repository.
<br />
<br />
### Project StructureThe basic structure of the `bamboo-specs` folder consists of 3 primary files:
- `pom.xml`: This file defines any dependencies you have, including the version of this library. While this is a Maven POM, this is strictly for Bamboo Specs to use. Your project can use absolutely any language, framework, build tool, etc. If you need to change the version of this pattern library or include other pattern libraries, you would do it here.
- `PipelineParameters.java`: A system generated and managed file that represents the information that is registered in CloudForge for your artifact and all the integrations, such as secrets management.
- `Pipeline.java`: A file that describes what you want your pipeline to look like. Generally, you will be able to use the [available pipeline patterns](https://docs.forge.lmig.com/articles/specs/patterns/patterns-overview) with little to no customization.

&nbsp;

You can learn more about Bamboo Specs in the [CloudForge Knowledge Base article](https://docs.forge.lmig.com/articles/specs/overview).
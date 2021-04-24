package forge;

import com.atlassian.bamboo.specs.api.BambooSpec;
import com.lmig.forge.bamboo.specs.patterns.AddOns;
import com.lmig.forge.bamboo.specs.patterns.build.node.NodeModuleBuild;

import static forge.PipelineParameters.PIPELINE_CONFIGURATION;

@BambooSpec
public class Pipeline {

    private static final AddOns ADD_ONS = new AddOns()
      .buildAddOns(
         /* Add an available build add-on here */
      )
      .deploymentAddOns(
         /* Add an available deployment add-on here */
      );

    public static void main(String[] args) {
      
      /**
       * BuildPattern: NodeModuleBuild
       *
       * For additional information see https://docs.forge.lmig.com/articles/specs/patterns/build/node/nodemodulebuild
       */
      new NodeModuleBuild(PIPELINE_CONFIGURATION)
        .addOns(ADD_ONS)
        .publish();

    }
}

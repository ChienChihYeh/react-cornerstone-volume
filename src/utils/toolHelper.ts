//TODO: add ww/wc tools

import * as cornerstoneTools from "@cornerstonejs/tools";
import * as cornerstone from "@cornerstonejs/core";
import {
  toolGroupId,
  viewportIds,
  renderingEngineId,
} from "../data/cornerstoneIds";
import { viewportColors, newStyles } from "../data/cornerstoneToolStyles";

const {
  ZoomTool,
  PanTool,
  CrosshairsTool,
  StackScrollMouseWheelTool,
  LengthTool,
  ToolGroupManager,
  annotation,
} = cornerstoneTools;

const { utilities } = cornerstone;

// cornerstone annotation styles
// https://www.cornerstonejs.org/docs/concepts/cornerstone-tools/annotation/config

function getReferenceLineColor(viewportId: string) {
  return viewportColors[viewportId];
}

export function initCornerstoneToolGroup() {
  cornerstoneTools.addTool(ZoomTool);
  cornerstoneTools.addTool(PanTool);
  cornerstoneTools.addTool(CrosshairsTool);
  cornerstoneTools.addTool(LengthTool);
  cornerstoneTools.addTool(StackScrollMouseWheelTool);

  const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

  if (!toolGroup) return;
  toolGroup.addTool(ZoomTool.toolName);
  toolGroup.addTool(PanTool.toolName);
  toolGroup.addTool(CrosshairsTool.toolName, { getReferenceLineColor });
  toolGroup.addTool(LengthTool.toolName);
  toolGroup.addTool(StackScrollMouseWheelTool.toolName);

  toolGroup.setToolActive(ZoomTool.toolName, {
    bindings: [{ mouseButton: 2 }],
  });
  toolGroup.setToolActive(PanTool.toolName, { bindings: [{ mouseButton: 3 }] });
  toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);

  const styles = annotation.config.style.getDefaultToolStyles();

  annotation.config.style.setDefaultToolStyles(
    utilities.deepMerge(styles, newStyles)
  );
}

export function toggleTool(toolName: string) {
  console.log(toolName);

  const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);

  if (!toolGroup) return;
  if (toolGroup?.getViewportIds.length === 0) {
    viewportIds.forEach((viewportId) => {
      toolGroup?.addViewport(viewportId, renderingEngineId);
    });
  }

  if (toolName === CrosshairsTool.toolName) {
    toolGroup.setToolActive(CrosshairsTool.toolName, {
      bindings: [{ mouseButton: 1 }],
    });
    toolGroup.setToolEnabled(LengthTool.toolName);
  }
  if (toolName === LengthTool.toolName) {
    toolGroup.setToolDisabled(CrosshairsTool.toolName);
    toolGroup.setToolActive(LengthTool.toolName, {
      bindings: [{ mouseButton: 1 }],
    });
  }
}

export function clearMeasurements() {
  // Basically you can access annotations via annotation manager here
  const annotationManaager = annotation.state.getAnnotationManager();

  const annotations = annotationManaager.getAllAnnotations();

  // We only want to remove length measurements, not crosshairs
  // By filtering viewPlaneNormal in metadata, we can also filter which viewport direction to clear
  const legnthAnnotations = annotations.filter(
    (annotation) => annotation.metadata.toolName === LengthTool.toolName
  );
  console.log(legnthAnnotations);
  legnthAnnotations.forEach((annotation) => {
    if (!annotation.annotationUID) return;
    annotationManaager.removeAnnotation(annotation.annotationUID);
  });

  // Rerender viewport because after annotations are removed
  const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
  renderingEngine?.render();
}

export function deleteCurrentMeasurement() {
  const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
  if (toolGroup?.currentActivePrimaryToolName !== LengthTool.toolName) return;

  const annotationManaager = annotation.state.getAnnotationManager();
  const annotations = annotationManaager.getAllAnnotations();

  const legnthAnnotations = annotations.filter(
    (annotation) => annotation.metadata.toolName === LengthTool.toolName
  );
  const highlightedAnnotations = legnthAnnotations.filter(
    (annotation) => annotation.highlighted
  );
  highlightedAnnotations.forEach((annotation) => {
    if (!annotation.annotationUID) return;
    annotationManaager.removeAnnotation(annotation.annotationUID);
  });

  const renderingEngine = cornerstone.getRenderingEngine(renderingEngineId);
  renderingEngine?.render();
}

export function toggleSlabScroll() {
  const toolGroup = ToolGroupManager.getToolGroup(toolGroupId);
  const config = toolGroup?.getToolConfiguration(
    StackScrollMouseWheelTool.toolName
  );
  console.log(config);

  const newState = !config.scrollSlabs;
  toolGroup?.setToolConfiguration(StackScrollMouseWheelTool.toolName, {
    scrollSlabs: newState,
  });
  return newState;
}

// Maybe this can be used for auto jump crosshairs to nodule position when selecting nodules?

// https://www.cornerstonejs.org/api/tools/class/crosshairstool/#addNewAnnotation
// addNewAnnotation
// addNewAnnotation(evt: InteractionEventType): CrosshairsAnnotation
// Overrides AnnotationTool.addNewAnnotation
// addNewAnnotation acts as jump for the crosshairs tool. It is called when the user clicks on the image. It does not store the annotation in the stateManager though.

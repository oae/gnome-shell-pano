import { File } from '@gi-types/gio2';
import { base64_decode } from '@gi-types/glib2';
import '@tensorflow/tfjs-backend-cpu';
import { GraphModel, loadGraphModel } from '@tensorflow/tfjs-converter';
import { env, io, Rank, setBackend, setPlatform, tensor, Tensor } from '@tensorflow/tfjs-core';
import { getCurrentExtension } from '../shell';

export interface ModelResult {
  languageId: string;
  confidence: number;
}

class InMemoryIOHandler implements io.IOHandler {
  constructor(private readonly modelJSON: io.ModelJSON, private readonly weights: ArrayBuffer) {}

  async load(): Promise<io.ModelArtifacts> {
    // We do not allow both modelTopology and weightsManifest to be missing.
    const modelTopology = this.modelJSON.modelTopology;
    const weightsManifest = this.modelJSON.weightsManifest;

    if (modelTopology === null && weightsManifest === null) {
      throw new Error('The model contains neither model topology or manifest for weights.');
    }

    return this.getModelArtifactsForJSON(this.modelJSON, (weightsManifest) => this.loadWeights(weightsManifest));
  }

  private async getModelArtifactsForJSON(
    modelJSON: io.ModelJSON,
    loadWeights: (
      weightsManifest: io.WeightsManifestConfig,
    ) => Promise<[/* weightSpecs */ io.WeightsManifestEntry[], /* weightData */ ArrayBuffer]>,
  ): Promise<io.ModelArtifacts> {
    const modelArtifacts: io.ModelArtifacts = {
      modelTopology: modelJSON.modelTopology,
      format: modelJSON.format,
      generatedBy: modelJSON.generatedBy,
      convertedBy: modelJSON.convertedBy,
    };

    if (modelJSON.trainingConfig !== null) {
      modelArtifacts.trainingConfig = modelJSON.trainingConfig;
    }
    if (modelJSON.weightsManifest !== null) {
      const [weightSpecs, weightData] = await loadWeights(modelJSON.weightsManifest);
      modelArtifacts.weightSpecs = weightSpecs;
      modelArtifacts.weightData = weightData;
    }
    if (modelJSON.signature !== null) {
      modelArtifacts.signature = modelJSON.signature;
    }
    if (modelJSON.userDefinedMetadata !== null) {
      modelArtifacts.userDefinedMetadata = modelJSON.userDefinedMetadata;
    }
    if (modelJSON.modelInitializer !== null) {
      modelArtifacts.modelInitializer = modelJSON.modelInitializer;
    }

    return modelArtifacts;
  }

  private async loadWeights(
    weightsManifest: io.WeightsManifestConfig,
  ): Promise<[io.WeightsManifestEntry[], ArrayBuffer]> {
    const weightSpecs: any[] = [];
    for (const entry of weightsManifest) {
      weightSpecs.push(...entry.weights);
    }

    return [weightSpecs, this.weights];
  }
}

export interface GuessLangOptions {
  modelJsonLoaderFunc?: () => Promise<{ [key: string]: any }>;
  weightsLoaderFunc?: () => Promise<ArrayBuffer>;
  minContentSize?: number;
  maxContentSize?: number;
  normalizeNewline?: boolean;
}

export class GuessLang {
  private static DEFAULT_MAX_CONTENT_SIZE = 100000;
  private static DEFAULT_MIN_CONTENT_SIZE = 20;

  private static NODE_MODEL_JSON_FUNC: () => Promise<{ [key: string]: any }> = async () => {
    const [, byteData] = File.new_for_path(`${getCurrentExtension().path}/models/model.json`).load_contents(null);
    const modelData = imports.byteArray.toString(byteData);
    return JSON.parse(modelData);
  };

  private static NODE_WEIGHTS_FUNC: () => Promise<ArrayBuffer> = async () => {
    const [, byteData] = File.new_for_path(`${getCurrentExtension().path}/models/group1-shard1of1.bin`).load_contents(
      null,
    );

    return byteData.buffer;
  };

  private _model: GraphModel | undefined;
  private _modelJson: io.ModelJSON | undefined;
  private _weights: ArrayBuffer | undefined;
  private readonly _minContentSize: number;
  private readonly _maxContentSize: number;
  private readonly _modelJsonLoaderFunc: () => Promise<{ [key: string]: any }>;
  private readonly _weightsLoaderFunc: () => Promise<ArrayBuffer>;
  private readonly _normalizeNewline: boolean;

  constructor(options?: GuessLangOptions) {
    this._modelJsonLoaderFunc = options?.modelJsonLoaderFunc ?? GuessLang.NODE_MODEL_JSON_FUNC;
    this._weightsLoaderFunc = options?.weightsLoaderFunc ?? GuessLang.NODE_WEIGHTS_FUNC;
    this._minContentSize = options?.minContentSize ?? GuessLang.DEFAULT_MIN_CONTENT_SIZE;
    this._maxContentSize = options?.maxContentSize ?? GuessLang.DEFAULT_MAX_CONTENT_SIZE;
    this._normalizeNewline = options?.normalizeNewline ?? true;
  }

  private async getModelJSON(): Promise<io.ModelJSON> {
    if (this._modelJson) {
      return this._modelJson;
    }

    this._modelJson = (await this._modelJsonLoaderFunc()) as io.ModelJSON;
    return this._modelJson;
  }

  private async getWeights() {
    if (this._weights) {
      return this._weights;
    }

    this._weights = await this._weightsLoaderFunc();
    return this._weights;
  }

  private async loadModel() {
    if (this._model) {
      return;
    }

    // These 2 env set's just suppress some warnings that get logged that
    // are not applicable for this use case.
    const tfEnv = env();
    tfEnv.set('IS_NODE', false);
    tfEnv.set('PROD', true);

    if (!(await setBackend('cpu'))) {
      throw new Error('Unable to set backend to CPU.');
    }

    setPlatform('linux', {
      decode(bytes, encoding) {
        return new TextDecoder(encoding).decode(bytes);
      },
      encode(text) {
        return new TextEncoder().encode(text);
      },
      now() {
        return new Date().getTime();
      },
      async fetch() {
        return null;
      },
    });

    tfEnv.global.atob = (data: string) => new TextDecoder().decode(base64_decode(data));

    const resolvedModelJSON = await this.getModelJSON();
    const resolvedWeights = await this.getWeights();
    this._model = await loadGraphModel(new InMemoryIOHandler(resolvedModelJSON, resolvedWeights));
  }

  public async runModel(content: string): Promise<Array<ModelResult>> {
    if (!content || content.length < this._minContentSize) {
      return [];
    }

    await this.loadModel();

    // larger files cause a "RangeError: Maximum call stack size exceeded" in tfjs.
    // So grab the first X characters as that should be good enough for guessing.
    if (content.length >= this._maxContentSize) {
      content = content.substring(0, this._maxContentSize);
    }

    if (this._normalizeNewline) {
      content = content.replace(/\r\n/g, '\n');
    }

    // call out to the model
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const predicted = await this._model!.executeAsync(tensor([content]));
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const probabilitiesTensor: Tensor<Rank> = Array.isArray(predicted) ? predicted[1]! : predicted;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const languageTensor: Tensor<Rank> = Array.isArray(predicted) ? predicted[0]! : predicted;
    const probabilities = probabilitiesTensor.dataSync() as Float32Array;
    const langs: Array<string> = languageTensor.dataSync() as any;

    const objs: Array<ModelResult> = [];
    for (let i = 0; i < langs.length; i++) {
      objs.push({
        languageId: langs[i],
        confidence: probabilities[i],
      });
    }

    let maxIndex = 0;
    for (let i = 0; i < probabilities.length; i++) {
      if (probabilities[i] > probabilities[maxIndex]) {
        maxIndex = i;
      }
    }

    return objs.sort((a, b) => {
      return b.confidence - a.confidence;
    });
  }

  public dispose() {
    this._model?.dispose();
  }
}

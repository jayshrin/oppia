// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Validator service for the interaction.
 */

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';

import { AnswerGroup } from
  'domain/exploration/AnswerGroupObjectFactory';
import { IWarning, baseInteractionValidationService } from
  'interactions/base-interaction-validation.service';
import { Outcome } from
  'domain/exploration/OutcomeObjectFactory';

import { AppConstants } from 'app.constants';

@Injectable({
  providedIn: 'root'
})
export class MultipleChoiceInputValidationService {
  constructor(
      private baseInteractionValidationServiceInstance:
        baseInteractionValidationService) {}

  // TODO(#7176): Replace 'any' with the exact type. This has been kept as
  // 'any' because 'customizationArgs' is a dict with possible underscore_cased
  // keys which give tslint errors against underscore_casing in favor of
  // camelCasing.
  getCustomizationArgsWarnings(customizationArgs: any): IWarning[] {
    var warningsList = [];

    this.baseInteractionValidationServiceInstance.requireCustomizationArguments(
      customizationArgs, ['choices']);

    var areAnyChoicesEmpty = false;
    var areAnyChoicesDuplicated = false;
    var seenChoices = [];
    var numChoices = customizationArgs.choices.value.length;
    for (var i = 0; i < customizationArgs.choices.value.length; i++) {
      var choice = customizationArgs.choices.value[i];
      if (choice.trim().length === 0) {
        areAnyChoicesEmpty = true;
      }
      if (seenChoices.indexOf(choice) !== -1) {
        areAnyChoicesDuplicated = true;
      }
      seenChoices.push(choice);
    }

    if (areAnyChoicesEmpty) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are nonempty.'
      });
    }
    if (areAnyChoicesDuplicated) {
      warningsList.push({
        type: AppConstants.WARNING_TYPES.CRITICAL,
        message: 'Please ensure the choices are unique.'
      });
    }
    return warningsList;
  }

  getAllWarnings(
      stateName: string, customizationArgs: any, answerGroups: AnswerGroup[],
      defaultOutcome: Outcome): IWarning[] {
    var warningsList = [];

    warningsList = warningsList.concat(
      this.getCustomizationArgsWarnings(customizationArgs));

    var numChoices = customizationArgs.choices.value.length;
    var selectedEqualsChoices = [];
    for (var i = 0; i < answerGroups.length; i++) {
      var rules = answerGroups[i].rules;
      for (var j = 0; j < rules.length; j++) {
        if (rules[j].type === 'Equals') {
          var choicePreviouslySelected = (
            selectedEqualsChoices.indexOf(rules[j].inputs.x) !== -1);
          if (!choicePreviouslySelected) {
            selectedEqualsChoices.push(rules[j].inputs.x);
          } else {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.CRITICAL,
              message: 'Please ensure rule ' + String(j + 1) +
                ' in group ' + String(i + 1) + ' is not equaling the ' +
                'same multiple choice option as another rule.'
            });
          }
          if (rules[j].inputs.x >= numChoices) {
            warningsList.push({
              type: AppConstants.WARNING_TYPES.CRITICAL,
              message: 'Please ensure rule ' + String(j + 1) +
                ' in group ' + String(i + 1) + ' refers to a valid choice.'
            });
          }
        }
      }
    }

    warningsList = warningsList.concat(
      this.baseInteractionValidationServiceInstance.getAnswerGroupWarnings(
        answerGroups, stateName));

    // Only require a default rule if some choices have not been taken care
    // of by rules.
    if (selectedEqualsChoices.length < numChoices) {
      if (!defaultOutcome || defaultOutcome.isConfusing(stateName)) {
        warningsList.push({
          type: AppConstants.WARNING_TYPES.ERROR,
          message: 'Please add something for Oppia to say in the ' +
            '\"All other answers\" response.'
        });
      }
    }

    return warningsList;
  }
}
angular.module('oppia').factory(
  'MultipleChoiceInputValidationService',
  downgradeInjectable(MultipleChoiceInputValidationService));
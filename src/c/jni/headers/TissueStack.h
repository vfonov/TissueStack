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
#ifndef TISSUE_STACK_H
	#define TISSUE_STACK_H

	#define MINC_FORMAT 1
	#define NIFTI_FORMAT 2

	#define TASK_PROGRESS 0
	#define TASK_RESUME 1
	#define TASK_PAUSE 2
	#define TASK_CANCEL 3

	#include "minc_info.h"
	#include "jni.h"
	#include "client.h"
	#include "utils.h"
	#include "strings.h"
	#include <signal.h>

	// IMPORTANT: use this variable to avoid seg faults that are caused by logging when called from JNI
	extern short i_am_jni;

	#ifdef __cplusplus
	extern "C" {
	#endif

		// for native signal handling
		void signal_handler(int sig);
		void registerSignalHandlers();
		// for JNI exception handling
		void checkAndClearJNIExceptions(JNIEnv *env);
		void throwJavaException(JNIEnv *env, const char *name, const char *msg);

		/*
		 * MINC INFO CALL
		 * Class:     au_edu_uq_cai_TissueStack_jni_TissueStack
		 * Method:    getMincInfo
		 * Signature: (Ljava/lang/String;)Lau/edu/uq/cai/TissueStack/dataobjects/MincInfo;
		 */
		JNIEXPORT jobject JNICALL Java_au_edu_uq_cai_TissueStack_jni_TissueStack_getMincInfo(JNIEnv *, jobject, jstring);

		/*
		 * MINC TILE CALL
		 * Class:     au_edu_uq_cai_TissueStack_jni_TissueStack
		 * Method:    tileMincVolume
		 * Signature: (Ljava/lang/String;Ljava/lang/String;[IDZ)V
		 */
		JNIEXPORT jstring JNICALL Java_au_edu_uq_cai_TissueStack_jni_TissueStack_tileMincVolume
		  (JNIEnv *, jobject, jstring, jstring, jintArray, jint, jdouble, jstring, jboolean);

		// convert nifti and mnc to raw
		JNIEXPORT jstring Java_au_edu_uq_cai_TissueStack_jni_TissueStack_convertImageFormatToRaw(
				JNIEnv *, jobject, jstring, jstring, jshort);

		// per cent querying
		JNIEXPORT jobject  Java_au_edu_uq_cai_TissueStack_jni_TissueStack_callTaskAction(JNIEnv *, jobject, jstring, jshort);

	#ifdef __cplusplus
	}
	#endif
#endif

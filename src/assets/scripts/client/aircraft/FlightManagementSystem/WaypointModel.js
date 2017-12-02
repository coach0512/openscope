import _isArray from 'lodash/isArray';
import _isEmpty from 'lodash/isEmpty';
import FixCollection from '../../navigationLibrary/FixCollection';
import {
    INVALID_INDEX,
    INVALID_NUMBER
} from '../../constants/globalConstants';
import {
    RNAV_WAYPOINT_DISPLAY_NAME,
    RNAV_WAYPOINT_PREFIX
} from '../../constants/waypointConstants';
// import { extractHeadingFromVectorSegment } from '../../navigationLibrary/Route/routeStringFormatHelper';
import {
    degreesToRadians,
    DECIMAL_RADIX
} from '../../utilities/unitConverters';

/**
 * A navigation point within an aircraft's flight plan
 *
 * This may include various types of restrictions or holding information, all
 * of which are used by the aircraft to follow various routes and procedures
 * utilized by the controller.
 *
 * @class WaypointModel
 */
export default class WaypointModel {
    /**
     * @for WaypointModel
     * @constructor
     */
    constructor(data) {
        if (typeof data !== 'string' && !_isArray(data)) {
            throw new TypeError(`Expected valid data to create WaypointModel but received ${data}`);
        }

        this.altitudeMaximum = -1;
        this.altitudeMinimum = -1;
        this.speedMaximum = -1;
        this.speedMinimum = -1;
        /**
         * Contains `timer`, `inboundHeading`, 'legLength', 'turnDirection'
         * @for WaypointModel
         * @property _holdParameters
         * @type {object}
         */
        this._holdParameters = null;
        this._isFlyOverWaypoint = false;
        this._isHoldWaypoint = false;
        this._isVectorWaypoint = false;
        this._name = '';
        this._positionModel = null;

        this.init(data);
    }

    /**
     * @for WaypointModel
     * @property hasAltitudeRestriction
     * @type {boolean}
     */
    get hasAltitudeRestriction() {
        return this.altitudeMaximum !== INVALID_NUMBER || this.altitudeMinimum !== INVALID_NUMBER;
    }

    /**
     * @for WaypointModel
     * @property hasRestriction
     * @type {boolean}
     */
    get hasRestriction() {
        return this.hasAltitudeRestriction || this.hasSpeedRestriction;
    }

    /**
     * @for WaypointModel
     * @property hasSpeedRestriction
     * @type {boolean}
     */
    get hasSpeedRestriction() {
        return this.speedMaximum !== INVALID_NUMBER || this.speedMinimum !== INVALID_NUMBER;
    }

    /**
     * Provides properties needed for an aircraft to execute a
     * holding pattern.
     *
     * This is used to match an existing API
     *
     * @for WaypointModel
     * @property hold
     * @return {object}
     */
    get holdParameters() {
        if (!this._isHoldWaypoint) {
            return;
        }

        return this._holdParameters;
    }

    /**
     * Returns whether `this` is a fly-over waypoint
     * @for WaypointModel
     * @property isFlyOverWaypoint
     * @return {boolean}
     */
    get isFlyOverWaypoint() {
        return this._isFlyOverWaypoint;
    }

    /**
    * Returns whether `this` is a hold waypoint
    *
    * @for WaypointModel
    * @property isHoldWaypoint
    * @type {boolean}
    */
    get isHoldWaypoint() {
        return this._isHoldWaypoint;
    }

    /**
    * Returns whether `this` is a vector waypoint
    *
    * @for WaypointModel
    * @property isVector
    * @return {boolean}
    */
    get isVectorWaypoint() {
        return this._isVectorWaypoint;
    }

    /**
     * Returns the name of the waypoint
     *
     * Will return `RNAV` if the waypoint is a specific point in space
     * and not a named fixed. These waypoints are prefixed with a
     * `_` symbol.
     *
     * @property name
     * @type {string}
     * @return {string}
     */
    get name() {
        if (this._name.indexOf(RNAV_WAYPOINT_PREFIX) !== INVALID_INDEX) {
            return RNAV_WAYPOINT_DISPLAY_NAME;
        }

        return this._name;
    }

    /**
     * Provide read-only public access to this._positionModel
     *
     * @for SpawnPatternModel
     * @property positionModel
     * @type {StaticPositionModel}
     */
    get positionModel() {
        return this._positionModel;
    }

    /**
     * Fascade to access relative position
     *
     * @for WaypointModel
     * @property relativePosition
     * @return {array<number>} [kilometersNorth, kilometersEast]
     */
    get relativePosition() {
        if (this.isVectorWaypoint) {
            return;
        }

        return this._positionModel.relativePosition;
    }

    // ------------------------------ LIFECYCLE ------------------------------

    /**
     * Initialize class properties
     *
     * @for WaypointModel
     * @method init
     * @param data {object}
     * @chainable
     */
    init(data) {
        let fixName = data;
        let restrictions = '';

        if (_isArray(data)) {
            if (data.length !== 2) {
                throw new TypeError(`Expected restricted fix to have restrictions, but received ${data}`);
            }

            fixName = data[0];
            restrictions = data[1];
        }

        this._name = fixName.replace('@', '').replace('^', '');

        this._initSpecialWaypoint(fixName);
        this._applyRestrictions(restrictions);
        this._initializePosition();

        return;
    }

    /**
     * Reset class properties
     *
     * @for WaypointModel
     * @method reset
     * @chainable
     */
    reset() {
        this.altitudeMaximum = -1;
        this.altitudeMinimum = -1;
        this.speedMaximum = -1;
        this.speedMinimum = -1;
        this._holdParameters = null;
        this._isFlyOverWaypoint = false;
        this._isHoldWaypoint = false;
        this._isVectorWaypoint = false;
        this._name = '';
        this._positionModel = null;

        return this;
    }

    /**
     * Initialize properties to make this waypoint a fly-over waypoint
     *
     * @for WaypointModel
     * @method _initFlyOverWaypoint
     * @private
     */
    _initFlyOverWaypoint() {
        this._isFlyOverWaypoint = true;
    }

    /**
     * Initialize properties to make this waypoint a hold waypoint
     *
     * @for WaypointModel
     * @method _initHoldWaypoint
     * @private
     */
    _initHoldWaypoint() {
        this._isHoldWaypoint = true;
        // TODO: These should be coming from a const file somewhere instead of being hard-coded
        this._holdParameters = {
            inboundHeading: undefined,
            legLength: 1,
            timer: INVALID_NUMBER,
            turnDirection: 'right'
        };
    }

    /**
     * Perform additional initialization tasks as needed if waypoint is a flyover/hold/vector/etc waypoint
     *
     * @for WaypointModel
     * @method _initSpecialWaypoint
     * @param fixname {string} name of the fix, including any special characters
     */
    _initSpecialWaypoint(fixName) {
        if (fixName.indexOf('^') !== INVALID_INDEX) {
            this._initFlyOverWaypoint();

            return;
        }

        if (fixName.indexOf('@') !== INVALID_INDEX) {
            this._initHoldWaypoint();

            return;
        }

        if (fixName.indexOf('#') !== INVALID_INDEX) {
            this._initVectorWaypoint();

            return;
        }
    }

    /**
     * Initialize properties to make this waypoint a vector waypoint
     *
     * @for WaypointModel
     * @method _initVectorWaypoint
     * @private
     */
    _initVectorWaypoint() {
        this._isVectorWaypoint = true;
    }

    // ------------------------------ PUBLIC ------------------------------

    /**
     * Calculate the distance between two waypoint models
     *
     * @for WaypointModel
     * @method calculateBearingToWaypoint
     * @param waypointModel {WaypointModel}
     * @return {number} bearing, in radians
     */
    calculateBearingToWaypoint(waypointModel) {
        if (!(waypointModel instanceof WaypointModel)) {
            // FIXME: Possibly an error is needed here?
            return;
        }

        if (this._isVectorWaypoint || waypointModel.isVectorWaypoint) {
            // FIXME: Possibly an error is needed here?
            return;
        }

        return this._positionModel.bearingToPosition(waypointModel.positionModel);
    }

    /**
     * Calculate the distance between two waypoint models
     *
     * @for WaypointModel
     * @method calculateDistanceToWaypoint
     * @param waypointModel {WaypointModel}
     * @return {number} distance, in nautical miles
     */
    calculateDistanceToWaypoint(waypointModel) {
        if (!(waypointModel instanceof WaypointModel)) {
            return 0;
        }

        if (this._isVectorWaypoint || waypointModel.isVectorWaypoint) {
            return 0;
        }

        return this._positionModel.distanceToPosition(waypointModel.positionModel);
    }

    /**
     * When `#_isVector` is true, this gets the heading that should be flown
     *
     * @for WaypointModel
     * @method _getVector
     * @type {number}
     */
    getVector() {
        if (!this._isVectorWaypoint) {
            return;
        }

        const fixNameWithOutPoundSign = this._name.replace('#', '');
        const headingInDegrees = parseInt(fixNameWithOutPoundSign, DECIMAL_RADIX);
        const headingInRadians = degreesToRadians(headingInDegrees);

        return headingInRadians;
    }

    /**
     * Check for a maximum altitude restriction below the given altitude
     *
     * @for WaypointModel
     * @method hasMaximumAltitudeBelow
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMaximumAltitudeBelow(altitude) {
        return this.altitudeMaximum !== INVALID_NUMBER
            && this.altitudeMaximum < altitude;
    }

    /**
     * Check for a minimum altitude restriction above the given altitude
     *
     * @for WaypointModel
     * @method hasMinimumAltitudeAbove
     * @param altitude {number} in feet
     * @return {boolean}
     */
    hasMinimumAltitudeAbove(altitude) {
        return this.altitudeMinimum !== INVALID_NUMBER
            && this.altitudeMinimum > altitude;
    }

    /**
     * Stores provided parameters for holding pattern, and marks this as a hold waypoint
     *
     * @for WaypointModel
     * @method setHoldParametersAndArmHold
     * @param inboundHeading {number} in radians
     * @param turnDirection {string} either left or right
     * @param legLength {string} length of the hold leg in minutes or nm
     */
    setHoldParametersAndArmHold(inboundHeading, turnDirection, legLength) {
        this._isHoldWaypoint = true;
        this._holdParameters = {
            turnDirection: turnDirection,
            inboundHeading: inboundHeading,
            legLength: legLength,
            timer: INVALID_NUMBER
        };
    }

    // ------------------------------ PRIVATE ------------------------------

    /**
     * Apply an altitude restriction in the appropriate properties
     *
     * @for WaypointModel
     * @method _applyAltitudeRestriction
     * @param restriction {string}
     */
    _applyAltitudeRestriction(restriction) {
        const altitude = parseInt(restriction, 10) * 100;

        if (restriction.indexOf('+') !== -1) {
            this.altitudeMinimum = altitude;

            return;
        } else if (restriction.indexOf('-') !== -1) {
            this.altitudeMaximum = altitude;

            return;
        }

        this.altitudeMaximum = altitude;
        this.altitudeMinimum = altitude;
    }

    /**
     * Parse the restrictions, and store the inferred meaning in the appropriate properties
     *
     * @for WaypointModel
     * @method _applyRestrictions
     * @param restrictions {string} restrictions, separated by pipe symbol: '|'
     */
    _applyRestrictions(restrictions) {
        if (_isEmpty(restrictions)) {
            return;
        }

        const restrictionCollection = restrictions.split('|');

        for (let i = 0; i < restrictionCollection.length; i++) {
            const restriction = restrictionCollection[i];

            // looking at the first letter of a restriction
            if (restriction[0] === 'A') {
                this._applyAltitudeRestriction(restriction.substr(1));
            } else if (restriction[0] === 'S') {
                this._applySpeedRestriction(restriction.substr(1));
            } else {
                throw new TypeError('Expected "A" or "S" prefix on restriction, ' +
                    `but received prefix '${restriction[0]}'`);
            }
        }
    }

    /**
     * Apply a speed restriction in the appropriate properties
     *
     * @for WaypointModel
     * @method _applySpeedRestriction
     * @param restriction {string}
     */
    _applySpeedRestriction(restriction) {
        const speed = parseInt(restriction, 10);

        if (restriction.indexOf('+') !== -1) {
            this.speedMinimum = speed;

            return;
        } else if (restriction.indexOf('-') !== -1) {
            this.speedMaximum = speed;

            return;
        }

        this.speedMaximum = speed;
        this.speedMinimum = speed;
    }

    /**
     * Initialize the waypoint's position model based on #_name
     *
     * @for WaypointModel
     * @method _initializePosition
     */
    _initializePosition() {
        if (this._isVectorWaypoint) {
            return;
        }

        const fixPosition = FixCollection.getPositionModelForFixName(this._name);

        if (fixPosition === null) {
            throw new TypeError(`Expected fix with known position, but cannot find fix '${this._name}'`);
        }

        this._positionModel = fixPosition;
    }
}
